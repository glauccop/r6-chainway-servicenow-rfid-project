package com.nowrfid

import android.bluetooth.BluetoothDevice
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.WritableMap
import com.facebook.fbreact.specs.NativeChainwayRfidSpec
import com.rscja.deviceapi.RFIDWithUHFBLE
import com.rscja.deviceapi.entity.BarcodeResult
import com.rscja.deviceapi.entity.UHFTAGInfo
import com.rscja.deviceapi.interfaces.ConnectionStatus
import com.rscja.deviceapi.interfaces.ConnectionStatusCallback
import com.rscja.deviceapi.interfaces.IUHFInventoryCallback
import com.rscja.deviceapi.interfaces.IUHFLocationCallback
import com.rscja.deviceapi.interfaces.KeyEventCallback
import com.rscja.deviceapi.interfaces.ScanBTCallback
import java.util.concurrent.ConcurrentLinkedQueue
import java.util.concurrent.Executors
import java.util.concurrent.ScheduledFuture
import java.util.concurrent.TimeUnit

/**
 * Bridge between React Native and Chainway's RFIDWithUHFBLE (R6 sled over BLE / Nordic UART).
 * Every SDK call is serialized on a single thread because the reader handles one command at a time.
 */
class ChainwayRfidModule(context: ReactApplicationContext) : NativeChainwayRfidSpec(context) {

  companion object {
    const val NAME = "ChainwayRfid"
    private const val BANK_EPC = 1
    private const val EPC_START_BIT = 32
    private const val TAG_FLUSH_MS = 150L

    const val EVT_DEVICE_FOUND = "ChainwayRfid.deviceFound"
    const val EVT_CONNECTION = "ChainwayRfid.connection"
    const val EVT_TAGS = "ChainwayRfid.tags"
    const val EVT_TRIGGER = "ChainwayRfid.trigger"
    const val EVT_LOCATE = "ChainwayRfid.locate"
    const val EVT_DEBUG = "ChainwayRfid.debug"
  }

  private val uhf: RFIDWithUHFBLE = RFIDWithUHFBLE.getInstance()
  private val commands = Executors.newSingleThreadExecutor()
  private val barcodeWorker = Executors.newSingleThreadExecutor()
  private val scheduler = Executors.newSingleThreadScheduledExecutor()
  private val pendingTags = ConcurrentLinkedQueue<UHFTAGInfo>()
  private var flushTask: ScheduledFuture<*>? = null
  private var initialized = false

  // ---------- helpers ----------

  private fun emit(event: String, payload: Any?) {
    reactApplicationContext.emitDeviceEvent(event, payload)
  }

  private fun debug(direction: String, command: String, detail: String) {
    val map = Arguments.createMap()
    map.putString("direction", direction)
    map.putString("command", command)
    map.putString("detail", detail)
    map.putDouble("ts", System.currentTimeMillis().toDouble())
    emit(EVT_DEBUG, map)
  }

  /** Runs an SDK call off the JS thread, logging request and response to the debug console. */
  private fun <T> call(command: String, args: String, promise: Promise, block: () -> T) {
    commands.execute {
      debug("tx", command, args)
      try {
        val result = block()
        debug("rx", command, result.toString())
        promise.resolve(result)
      } catch (e: Throwable) {
        debug("err", command, e.toString())
        promise.reject("E_$command", e.message ?: e.toString(), e)
      }
    }
  }

  private fun epcBits(epc: String) = epc.length * 4

  private fun tagToMap(info: UHFTAGInfo): WritableMap {
    val map = Arguments.createMap()
    map.putString("epc", info.getEPC() ?: "")
    map.putString("tid", info.getTid() ?: "")
    map.putString("user", info.getUser() ?: "")
    map.putString("pc", info.getPc() ?: "")
    map.putString("rssi", info.getRssi() ?: "")
    map.putString("antenna", info.getAnt() ?: "")
    map.putInt("count", info.getCount())
    val ts = info.getTimestamp()
    map.putDouble("timestamp", if (ts > 0) ts.toDouble() else System.currentTimeMillis().toDouble())
    return map
  }

  private fun statusName(status: ConnectionStatus?) = when (status) {
    ConnectionStatus.CONNECTED -> "connected"
    ConnectionStatus.CONNECTING -> "connecting"
    else -> "disconnected"
  }

  private fun ensureInit() {
    if (!initialized) {
      initialized = uhf.init(reactApplicationContext)
      uhf.setKeyEventCallback(object : KeyEventCallback {
        override fun onKeyDown(keyCode: Int) {
          val map = Arguments.createMap()
          map.putString("action", "down")
          map.putInt("keyCode", keyCode)
          emit(EVT_TRIGGER, map)
        }

        override fun onKeyUp(keyCode: Int) {
          val map = Arguments.createMap()
          map.putString("action", "up")
          map.putInt("keyCode", keyCode)
          emit(EVT_TRIGGER, map)
        }
      })
    }
  }

  // ---------- connection ----------

  override fun initReader(promise: Promise) = call("initReader", "", promise) {
    ensureInit()
    initialized
  }

  override fun startScanDevices() {
    commands.execute {
      ensureInit()
      debug("tx", "startScanBTDevices", "")
      uhf.startScanBTDevices(ScanBTCallback { device: BluetoothDevice, rssi: Int, _: ByteArray? ->
        val map = Arguments.createMap()
        map.putString("address", device.address)
        map.putString("name", try { device.name ?: "" } catch (e: SecurityException) { "" })
        map.putInt("rssi", rssi)
        emit(EVT_DEVICE_FOUND, map)
      })
    }
  }

  override fun stopScanDevices() {
    commands.execute {
      debug("tx", "stopScanBTDevices", "")
      uhf.stopScanBTDevices()
    }
  }

  override fun connect(address: String) {
    commands.execute {
      ensureInit()
      debug("tx", "connect", address)
      uhf.connect(address, object : ConnectionStatusCallback<Any> {
        override fun getStatus(status: ConnectionStatus?, device: Any?) {
          val name = statusName(status)
          debug("rx", "connectionStatus", name)
          if (status == ConnectionStatus.CONNECTED) {
            commands.execute { runCatching { uhf.setBarcodeTypeInSSIID(true) } }
          }
          val map = Arguments.createMap()
          map.putString("status", name)
          map.putString("address", (device as? BluetoothDevice)?.address ?: address)
          emit(EVT_CONNECTION, map)
        }
      })
    }
  }

  override fun disconnect() {
    commands.execute {
      debug("tx", "disconnect", "")
      runCatching { uhf.stopInventory() }
      stopFlushing()
      uhf.disconnect()
    }
  }

  override fun getConnectionStatus(promise: Promise) = call("getConnectStatus", "", promise) {
    statusName(uhf.getConnectStatus())
  }

  override fun getReaderInfo(promise: Promise) = call("getReaderInfo", "", promise) {
    val map = Arguments.createMap()
    runCatching { map.putInt("battery", uhf.getBattery()) }
    runCatching { map.putString("version", uhf.getVersion() ?: "") }
    runCatching { map.putInt("temperature", uhf.getTemperature()) }
    runCatching { map.putInt("power", uhf.getPower()) }
    runCatching { map.putInt("frequencyMode", uhf.getFrequencyMode()) }
    runCatching { map.putString("bleHardwareVersion", uhf.getBleHardwareVersion() ?: "") }
    map
  }

  // ---------- inventory (read) ----------

  private fun startFlushing() {
    stopFlushing()
    flushTask = scheduler.scheduleWithFixedDelay({
      if (pendingTags.isEmpty()) return@scheduleWithFixedDelay
      val array = Arguments.createArray()
      while (true) {
        val info = pendingTags.poll() ?: break
        array.pushMap(tagToMap(info))
      }
      debug("rx", "inventoryCallback", "${array.size()} tag(s)")
      emit(EVT_TAGS, array)
    }, TAG_FLUSH_MS, TAG_FLUSH_MS, TimeUnit.MILLISECONDS)
  }

  private fun stopFlushing() {
    flushTask?.cancel(false)
    flushTask = null
  }

  override fun startInventory(promise: Promise) = call("startInventoryTag", "", promise) {
    pendingTags.clear()
    uhf.setInventoryCallback(IUHFInventoryCallback { info -> if (info != null) pendingTags.add(info) })
    val ok = uhf.startInventoryTag()
    if (ok) startFlushing()
    ok
  }

  override fun stopInventory(promise: Promise) = call("stopInventory", "", promise) {
    val ok = uhf.stopInventory()
    // keep flushing briefly so tags read right before stop still reach JS
    val task = flushTask
    scheduler.schedule({
      task?.cancel(false)
      if (flushTask === task) flushTask = null
    }, TAG_FLUSH_MS * 2, TimeUnit.MILLISECONDS)
    ok
  }

  override fun inventorySingle(promise: Promise) = call("inventorySingleTag", "", promise) {
    uhf.inventorySingleTag()?.let { tagToMap(it) }
  }

  override fun setInventoryMode(includeTid: Boolean, promise: Promise) =
    call(if (includeTid) "setEPCAndTIDMode" else "setEPCMode", "", promise) {
      if (includeTid) uhf.setEPCAndTIDMode() else uhf.setEPCMode()
    }

  override fun setFilter(bank: Double, ptr: Double, cnt: Double, data: String, promise: Promise) =
    call("setFilter", "bank=$bank ptr=$ptr cnt=$cnt data=$data", promise) {
      uhf.setFilter(bank.toInt(), ptr.toInt(), cnt.toInt(), data)
    }

  // ---------- tag memory (read / write / erase / lock / kill) ----------

  override fun readData(accessPwd: String, bank: Double, ptr: Double, cnt: Double, filterEpc: String, promise: Promise) =
    call("readData", "bank=$bank ptr=$ptr cnt=$cnt filter=$filterEpc", promise) {
      val result = if (filterEpc.isEmpty()) {
        uhf.readData(accessPwd, bank.toInt(), ptr.toInt(), cnt.toInt())
      } else {
        uhf.readData(accessPwd, BANK_EPC, EPC_START_BIT, epcBits(filterEpc), filterEpc, bank.toInt(), ptr.toInt(), cnt.toInt())
      }
      result ?: throw IllegalStateException("read failed (no tag / wrong password)")
    }

  override fun writeData(accessPwd: String, bank: Double, ptr: Double, cnt: Double, data: String, filterEpc: String, promise: Promise) =
    call("writeData", "bank=$bank ptr=$ptr cnt=$cnt data=$data filter=$filterEpc", promise) {
      if (filterEpc.isEmpty()) {
        uhf.writeData(accessPwd, bank.toInt(), ptr.toInt(), cnt.toInt(), data)
      } else {
        uhf.writeData(accessPwd, BANK_EPC, EPC_START_BIT, epcBits(filterEpc), filterEpc, bank.toInt(), ptr.toInt(), cnt.toInt(), data)
      }
    }

  override fun writeEpc(accessPwd: String, newEpc: String, filterEpc: String, promise: Promise) =
    call("writeDataToEpc", "new=$newEpc filter=$filterEpc", promise) {
      if (filterEpc.isEmpty()) {
        uhf.writeDataToEpc(accessPwd, newEpc)
      } else {
        uhf.writeDataToEpc(accessPwd, BANK_EPC, EPC_START_BIT, epcBits(filterEpc), filterEpc, newEpc)
      }
    }

  override fun eraseData(accessPwd: String, bank: Double, ptr: Double, cnt: Double, filterEpc: String, promise: Promise) =
    call("eraseData", "bank=$bank ptr=$ptr cnt=$cnt filter=$filterEpc", promise) {
      if (filterEpc.isEmpty()) {
        uhf.eraseData(accessPwd, bank.toInt(), ptr.toInt(), cnt.toInt())
      } else {
        uhf.eraseData(accessPwd, BANK_EPC, EPC_START_BIT, epcBits(filterEpc), filterEpc, bank.toInt(), ptr.toInt(), cnt.toInt())
      }
    }

  override fun lockTag(accessPwd: String, lockBanks: ReadableArray, lockMode: Double, filterEpc: String, promise: Promise) =
    call("lockMem", "banks=$lockBanks mode=$lockMode filter=$filterEpc", promise) {
      val banks = ArrayList<Int>()
      for (i in 0 until lockBanks.size()) banks.add(lockBanks.getInt(i))
      val lockCode = uhf.generateLockCode(banks, lockMode.toInt())
      debug("rx", "generateLockCode", lockCode ?: "null")
      if (filterEpc.isEmpty()) {
        uhf.lockMem(accessPwd, lockCode)
      } else {
        uhf.lockMem(accessPwd, BANK_EPC, EPC_START_BIT, epcBits(filterEpc), filterEpc, lockCode)
      }
    }

  override fun killTag(killPwd: String, filterEpc: String, promise: Promise) =
    call("killTag", "filter=$filterEpc", promise) {
      if (filterEpc.isEmpty()) {
        uhf.killTag(killPwd)
      } else {
        uhf.killTag(killPwd, BANK_EPC, EPC_START_BIT, epcBits(filterEpc), filterEpc)
      }
    }

  // ---------- locate (tag finder) ----------

  override fun startLocate(epc: String, promise: Promise) = call("startLocation", epc, promise) {
    uhf.startLocation(reactApplicationContext, epc, BANK_EPC, EPC_START_BIT, IUHFLocationCallback { value, valid ->
      val map = Arguments.createMap()
      map.putInt("value", value)
      map.putBoolean("valid", valid)
      emit(EVT_LOCATE, map)
    })
  }

  override fun stopLocate(promise: Promise) = call("stopLocation", "", promise) { uhf.stopLocation() }

  // ---------- RF configuration ----------

  override fun getPower(promise: Promise) = call("getPower", "", promise) { uhf.getPower().toDouble() }

  override fun setPower(power: Double, promise: Promise) = call("setPower", "$power", promise) { uhf.setPower(power.toInt()) }

  override fun getFrequencyMode(promise: Promise) = call("getFrequencyMode", "", promise) { uhf.getFrequencyMode().toDouble() }

  override fun setFrequencyMode(mode: Double, promise: Promise) =
    call("setFrequencyMode", "0x" + Integer.toHexString(mode.toInt()), promise) { uhf.setFrequencyMode(mode.toInt()) }

  override fun setBeep(enabled: Boolean, promise: Promise) = call("setBeep", "$enabled", promise) { uhf.setBeep(enabled) }

  override fun factoryReset(promise: Promise) = call("factoryReset", "", promise) { uhf.factoryReset() }

  // ---------- barcode / QR (R6 2D imager over the same BLE link) ----------

  override fun scanBarcode(promise: Promise) {
    barcodeWorker.execute {
      debug("tx", "startScanBarcode", "")
      try {
        val result: BarcodeResult? = uhf.startScanBarcode()
        val bytes = result?.getBarcodeBytesData()
        if (result == null || bytes == null || bytes.isEmpty()) {
          debug("rx", "startScanBarcode", "no barcode")
          promise.resolve(null)
          return@execute
        }
        val map = Arguments.createMap()
        map.putString("value", String(bytes, Charsets.UTF_8))
        map.putString("hex", bytes.joinToString("") { "%02X".format(it) })
        map.putInt("ssiId", result.getBarcodeSSIID())
        map.putString("symbology", runCatching { BarcodeResult.getBarcodeTypeBySSIID(result.getBarcodeSSIID()) }.getOrNull() ?: "")
        debug("rx", "startScanBarcode", map.toString())
        promise.resolve(map)
      } catch (e: Throwable) {
        debug("err", "startScanBarcode", e.toString())
        promise.reject("E_barcode", e.message ?: e.toString(), e)
      }
    }
  }

  override fun stopBarcode(promise: Promise) = call("stopScanBarcode", "", promise) { uhf.stopScanBarcode() }

  override fun invalidate() {
    stopFlushing()
    runCatching { uhf.stopInventory() }
    runCatching { uhf.disconnect() }
    runCatching { uhf.free() }
    commands.shutdownNow()
    barcodeWorker.shutdownNow()
    scheduler.shutdownNow()
    super.invalidate()
  }
}
