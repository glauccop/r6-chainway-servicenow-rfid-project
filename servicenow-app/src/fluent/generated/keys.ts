import '@servicenow/sdk/global'

declare global {
    namespace Now {
        namespace Internal {
            interface Keys extends KeysRegistry {
                explicit: {
                    bom_json: {
                        table: 'sys_module'
                        id: 'a974b015e0a94e8d9da3d749f485fe59'
                    }
                    'nowrfid-api': {
                        table: 'sys_ws_definition'
                        id: '557fb021bfe54e9599574bd49e1482c5'
                    }
                    'nowrfid-api-batch': {
                        table: 'sys_ws_operation'
                        id: 'f5e3ab0cebad47009c4b71ef204754a4'
                    }
                    'nowrfid-api-ping': {
                        table: 'sys_ws_operation'
                        id: '835a94e0240a44fea4302afb8b26f863'
                    }
                    'nowrfid-menu': {
                        table: 'sys_app_application'
                        id: 'c7295df485f6413d81054920029a567f'
                    }
                    'nowrfid-module-batches': {
                        table: 'sys_app_module'
                        id: '18118f4fda164d78930c6b7edb28afab'
                    }
                    'nowrfid-module-items': {
                        table: 'sys_app_module'
                        id: '72f6679a1215493fb1faec151b069879'
                    }
                    'nowrfid-rest-execute': {
                        table: 'sys_security_acl'
                        id: '8635606eb702499194ba6853f24ed3ef'
                    }
                    package_json: {
                        table: 'sys_module'
                        id: 'e95f85fdcf1c4274b886d838a062c483'
                    }
                    'src_server_batch-service_ts': {
                        table: 'sys_module'
                        id: '97972ac110f744878ce66b45a406c765'
                    }
                    src_server_rest_handlers_ts: {
                        table: 'sys_module'
                        id: 'e172b146243a4b8697ac6ee4b686c5f4'
                    }
                    'x_nowrfid_scan_batch-create': {
                        table: 'sys_security_acl'
                        id: 'b281087f6557454ea27fa8d872ac6497'
                    }
                    'x_nowrfid_scan_batch-delete': {
                        table: 'sys_security_acl'
                        id: 'b385f5a224c64fb9a1bc36f2f13710b5'
                    }
                    'x_nowrfid_scan_batch-read': {
                        table: 'sys_security_acl'
                        id: 'f8e96b2df3d04186aed4951210dbddad'
                    }
                    'x_nowrfid_scan_batch-write': {
                        table: 'sys_security_acl'
                        id: '7e7cfa3d1b2b4faeb9f3e7778ca28a77'
                    }
                    'x_nowrfid_scan_item-create': {
                        table: 'sys_security_acl'
                        id: '312a738f7bba4c38a0ff462140e91858'
                    }
                    'x_nowrfid_scan_item-delete': {
                        table: 'sys_security_acl'
                        id: '5005251c9754465e8a9df4f072116b40'
                    }
                    'x_nowrfid_scan_item-read': {
                        table: 'sys_security_acl'
                        id: '7316f1c7f1fe4dbcb9bee9509cf77729'
                    }
                    'x_nowrfid_scan_item-write': {
                        table: 'sys_security_acl'
                        id: '8e22e452dd824bd38f1cbbd2572eea0b'
                    }
                }
                composite: [
                    {
                        table: 'sys_choice'
                        id: '0154d78944ca4cfe89d5dd959391f8ac'
                        key: {
                            name: 'x_nowrfid_scan_item'
                            element: 'operation'
                            value: 'read'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_index'
                        id: '01ea9a41e07546d39f6690c78c210795'
                        key: {
                            logical_table_name: 'x_nowrfid_scan_batch'
                            col_name_string: 'client_batch_id'
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: '0a434f0c18b449a1a1deadceb97ad6d1'
                        key: {
                            name: 'x_nowrfid_scan_item'
                            element: 'match_status'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '0b3af4187ffa47c1a42c57a8621c6d02'
                        key: {
                            name: 'x_nowrfid_scan_item'
                            element: 'capture_type'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '0f86251efbe14c5bb971e8352961c565'
                        key: {
                            name: 'x_nowrfid_scan_item'
                            element: 'match_status'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '105e0b7e4a6c4a2aa2992bb6b8c10a48'
                        key: {
                            sys_security_acl: '8e22e452dd824bd38f1cbbd2572eea0b'
                            sys_user_role: {
                                id: '8ceb2309ca854833941f96b5a4d2147e'
                                key: {
                                    name: 'x_nowrfid.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '1105dd363e0d4110a147d110a8ea6481'
                        key: {
                            sys_security_acl: 'b281087f6557454ea27fa8d872ac6497'
                            sys_user_role: {
                                id: '8ceb2309ca854833941f96b5a4d2147e'
                                key: {
                                    name: 'x_nowrfid.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '126aacb93564474ea2af55972d0cb76f'
                        key: {
                            name: 'x_nowrfid_scan_batch'
                            element: 'received_at'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '18d84cb2879046f49e3415fdf8f64c24'
                        key: {
                            name: 'x_nowrfid_scan_batch'
                            element: 'department'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '1cbdb0b340ea474bac9c8a357a0ed084'
                        key: {
                            name: 'x_nowrfid_scan_item'
                            element: 'read_count'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '1cdcd527177646a68e5a88ad792b3d3c'
                        key: {
                            name: 'x_nowrfid_scan_item'
                            element: 'raw_payload'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '1ee775a0e00e4f24b1d5c2871ce7bdc2'
                        key: {
                            name: 'x_nowrfid_scan_item'
                            element: 'client_item_id'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '2095bb252d10485098c49c2b80f2b5c4'
                        key: {
                            sys_security_acl: '8635606eb702499194ba6853f24ed3ef'
                            sys_user_role: {
                                id: '8ceb2309ca854833941f96b5a4d2147e'
                                key: {
                                    name: 'x_nowrfid.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '23191c3a5e004b98932c8d564813cf29'
                        key: {
                            name: 'x_nowrfid_scan_batch'
                            element: 'received_at'
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: '2c51e90233c94ae6ba5e1f915be55695'
                        key: {
                            name: 'x_nowrfid_scan_item'
                            element: 'operation'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '2d29ca4349eb438b820a84783ff2a399'
                        key: {
                            name: 'x_nowrfid_scan_batch'
                            element: 'item_count'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '32d373e1b2fb4d45b22df1c36d7dd2b9'
                        key: {
                            name: 'x_nowrfid_scan_batch'
                            element: 'client_batch_id'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '32e4a5ab40b443c9be9a223d70f8d266'
                        key: {
                            name: 'x_nowrfid_scan_batch'
                            element: 'app_version'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '3761e712a376473d82cda59d9b45dab7'
                        key: {
                            name: 'x_nowrfid_scan_item'
                            element: 'operation'
                            value: 'write'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '392c2e184e634ddb8b0bfaafd437bb8a'
                        key: {
                            name: 'x_nowrfid_scan_batch'
                            element: 'captured_at'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '3f0c68a52dd246cd91e05ff04e12d470'
                        key: {
                            name: 'x_nowrfid_scan_item'
                            element: 'barcode_value'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '3f1f0701bae5439985100bd93248f9f7'
                        key: {
                            name: 'x_nowrfid_scan_item'
                            element: 'symbology'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: '446bd5b89b9c46399aee3f0ccb2f1633'
                        key: {
                            name: 'x_nowrfid_scan_item'
                            element: 'capture_type'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '4cc791ed2a5843e3ad62b06793d03db2'
                        key: {
                            name: 'x_nowrfid_scan_batch'
                            element: 'status'
                        }
                    },
                    {
                        table: 'ua_table_licensing_config'
                        id: '4ecc144ee48e4fc8a8c120e4e26580f6'
                        key: {
                            name: 'x_nowrfid_scan_batch'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '546aeced6a1247488da1d194888f6796'
                        key: {
                            name: 'x_nowrfid_scan_item'
                            element: 'match_status'
                            value: 'unmatched'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '55b89d39088b471b80c76de54587647c'
                        key: {
                            name: 'x_nowrfid_scan_batch'
                            element: 'reader_mac'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '5684183c00c741e2abaa1575ef4bdd3b'
                        key: {
                            name: 'x_nowrfid_scan_batch'
                            element: 'captured_at'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '5cfeee66e68e4fb88a18ba58f7a41a18'
                        key: {
                            sys_security_acl: '7316f1c7f1fe4dbcb9bee9509cf77729'
                            sys_user_role: {
                                id: '71397305bd134cbb9ade356710f91fb3'
                                key: {
                                    name: 'x_nowrfid.integration'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '5e250dd77ac14dfea28d25e04ac9ebdd'
                        key: {
                            name: 'x_nowrfid_scan_batch'
                            element: 'notes'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '5fc4291cfe434a89a83e2b158633779a'
                        key: {
                            name: 'x_nowrfid_scan_item'
                            element: 'barcode_value'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '5feca4e458294dc2a2310c4cb09211c6'
                        key: {
                            name: 'x_nowrfid_scan_item'
                            element: 'match_status'
                            value: 'matched'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_db_object'
                        id: '6340d0006af343f88573906430f4b806'
                        key: {
                            name: 'x_nowrfid_scan_item'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '64e0700b001146ae9fb72f73fda63765'
                        key: {
                            name: 'x_nowrfid_scan_item'
                            element: 'rssi'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '66240559d80d4807b54b1532c2004d8d'
                        key: {
                            name: 'x_nowrfid_scan_batch'
                            element: 'status'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '66dae0f2916e4f8d85cee2bbb023b3ab'
                        key: {
                            name: 'x_nowrfid_scan_batch'
                            element: 'status'
                            value: 'processed'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_index'
                        id: '6ca5b04017974f4b9846e52b0e8ef03a'
                        key: {
                            logical_table_name: 'x_nowrfid_scan_item'
                            col_name_string: 'barcode_value'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '6e58b56c98214559b4584ab27d4d636b'
                        key: {
                            name: 'x_nowrfid_scan_item'
                            element: 'epc'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '6f8ed90bf7a34391a972140facb8f5e5'
                        key: {
                            name: 'x_nowrfid_scan_item'
                            element: 'rssi'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_user_role'
                        id: '71397305bd134cbb9ade356710f91fb3'
                        key: {
                            name: 'x_nowrfid.integration'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '7275ad46f1654792af99178aac192518'
                        key: {
                            name: 'x_nowrfid_scan_item'
                            element: 'operation'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '72ef14039bcd428298c269c6a8dbf53a'
                        key: {
                            name: 'x_nowrfid_scan_batch'
                            element: 'device_id'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '75302b0f284d4b5ba16ef8d05c237c69'
                        key: {
                            sys_security_acl: 'f8e96b2df3d04186aed4951210dbddad'
                            sys_user_role: {
                                id: '71397305bd134cbb9ade356710f91fb3'
                                key: {
                                    name: 'x_nowrfid.integration'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '753e07b88a9f43b392adb68c81e759d4'
                        key: {
                            sys_security_acl: '7316f1c7f1fe4dbcb9bee9509cf77729'
                            sys_user_role: {
                                id: '8ceb2309ca854833941f96b5a4d2147e'
                                key: {
                                    name: 'x_nowrfid.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '76de8ce28b0844edb46883c2d38903f7'
                        key: {
                            name: 'x_nowrfid_scan_batch'
                            element: 'client_batch_id'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '7a7d707d07584463a34ddf9e42198b7f'
                        key: {
                            name: 'x_nowrfid_scan_item'
                            element: 'epc'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '7ba79b7ab3e64b88994e30f1dff3fd6a'
                        key: {
                            name: 'x_nowrfid_scan_batch'
                            element: 'number'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '805d7d35e5eb4edb8eb5a92996252bed'
                        key: {
                            name: 'x_nowrfid_scan_item'
                            element: 'read_count'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: '813a040035d74608954a6210d220db74'
                        key: {
                            name: 'x_nowrfid_scan_batch'
                            element: 'status'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '813d809fef624e79adcd0de9d6e40aa6'
                        key: {
                            name: 'x_nowrfid_scan_item'
                            element: 'operation'
                        }
                    },
                    {
                        table: 'sys_user_role_contains'
                        id: '822222d5ddde4bc2b1fd4277e15eb4ce'
                        key: {
                            role: {
                                id: '8ceb2309ca854833941f96b5a4d2147e'
                                key: {
                                    name: 'x_nowrfid.admin'
                                }
                            }
                            contains: {
                                id: '71397305bd134cbb9ade356710f91fb3'
                                key: {
                                    name: 'x_nowrfid.integration'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '82a7640c0016424c90dba0c38bd79285'
                        key: {
                            name: 'x_nowrfid_scan_batch'
                            element: 'NULL'
                        }
                    },
                    {
                        table: 'sys_index'
                        id: '8359555dd84a4564b14785d046235338'
                        key: {
                            logical_table_name: 'x_nowrfid_scan_item'
                            col_name_string: 'epc'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '866339318f664d859753597a1b8ad557'
                        key: {
                            name: 'x_nowrfid_scan_item'
                            element: 'client_item_id'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '877b33f433504ce38d0b6ec92e86c72d'
                        key: {
                            name: 'x_nowrfid_scan_item'
                            element: 'NULL'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '8918c9e869584b9893d0c111f5d434e0'
                        key: {
                            sys_security_acl: 'b281087f6557454ea27fa8d872ac6497'
                            sys_user_role: {
                                id: '71397305bd134cbb9ade356710f91fb3'
                                key: {
                                    name: 'x_nowrfid.integration'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '8a9d09ef33544efc9153037a5c09405d'
                        key: {
                            name: 'x_nowrfid_scan_item'
                            element: 'raw_payload'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '8b9c5dcaa0e64edcab8fe8f6a0ec8fd6'
                        key: {
                            name: 'x_nowrfid_scan_item'
                            element: 'batch'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_user_role'
                        id: '8ceb2309ca854833941f96b5a4d2147e'
                        key: {
                            name: 'x_nowrfid.admin'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '8deaac7e12d740c7a826ba715a36df0b'
                        key: {
                            sys_security_acl: '7e7cfa3d1b2b4faeb9f3e7778ca28a77'
                            sys_user_role: {
                                id: '8ceb2309ca854833941f96b5a4d2147e'
                                key: {
                                    name: 'x_nowrfid.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '8fe666ef04c24f0f84ddefe89cc06613'
                        key: {
                            name: 'x_nowrfid_scan_batch'
                            element: 'operator'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '8ff62d23f6d5406a91779294a140a928'
                        key: {
                            name: 'x_nowrfid_scan_batch'
                            element: 'operator'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '9093767502764d3cb9ce569aee7f60f5'
                        key: {
                            name: 'x_nowrfid_scan_item'
                            element: 'user_data'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '93ef99bb14394851b66a25be31178fb9'
                        key: {
                            sys_security_acl: '312a738f7bba4c38a0ff462140e91858'
                            sys_user_role: {
                                id: '71397305bd134cbb9ade356710f91fb3'
                                key: {
                                    name: 'x_nowrfid.integration'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '9f2f299165c04f2d992fd8c8147254ce'
                        key: {
                            name: 'x_nowrfid_scan_item'
                            element: 'batch'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'a10ae139dd3c45be8dccf8a4583787d0'
                        key: {
                            name: 'x_nowrfid_scan_item'
                            element: 'match_status'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'a1a59bfe5d704d12bbd4cfa578107bbf'
                        key: {
                            name: 'x_nowrfid_scan_batch'
                            element: 'number'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'a9329579d21141d5b7447b39f3c2108d'
                        key: {
                            name: 'x_nowrfid_scan_batch'
                            element: 'item_count'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'ad84794b9e5348aebdfe2ea4e00fd4c7'
                        key: {
                            sys_security_acl: '312a738f7bba4c38a0ff462140e91858'
                            sys_user_role: {
                                id: '8ceb2309ca854833941f96b5a4d2147e'
                                key: {
                                    name: 'x_nowrfid.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'ad9fef86dff540819ffc84cfe9e15ea6'
                        key: {
                            name: 'x_nowrfid_scan_item'
                            element: 'symbology'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'b0a641d70c744f7ab3921e9f76bbb6e2'
                        key: {
                            sys_security_acl: 'f8e96b2df3d04186aed4951210dbddad'
                            sys_user_role: {
                                id: '8ceb2309ca854833941f96b5a4d2147e'
                                key: {
                                    name: 'x_nowrfid.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'b376a6a285734795922ec9d09225fe36'
                        key: {
                            sys_security_acl: '5005251c9754465e8a9df4f072116b40'
                            sys_user_role: {
                                id: '8ceb2309ca854833941f96b5a4d2147e'
                                key: {
                                    name: 'x_nowrfid.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'b9359c6cc7db49569fefa7e48c056112'
                        key: {
                            name: 'x_nowrfid_scan_item'
                            element: 'captured_at'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'bac83c30f1864866a60c4e228548d863'
                        key: {
                            name: 'x_nowrfid_scan_batch'
                            element: 'status'
                            value: 'error'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'bb81d79d686648eb9eb9ae0e767b4810'
                        key: {
                            name: 'x_nowrfid_scan_item'
                            element: 'user_data'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'bef991e66ba246b19dc0e9a96e07e209'
                        key: {
                            name: 'x_nowrfid_scan_batch'
                            element: 'location'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'c07462528e6b48cb9a7c9fe9b171c661'
                        key: {
                            name: 'x_nowrfid_scan_item'
                            element: 'captured_at'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'c0930c43ce5a45e39d1bace0fc45d499'
                        key: {
                            name: 'x_nowrfid_scan_item'
                            element: 'matched_asset'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'c42b09229f284a88a247bd2262f7723a'
                        key: {
                            name: 'x_nowrfid_scan_item'
                            element: 'capture_type'
                            value: 'qr'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'c436985aefab4f3580091ff346c73c2f'
                        key: {
                            name: 'x_nowrfid_scan_batch'
                            element: 'status'
                            value: 'processing'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'c4df996e05744b0da4d70019da3c8c95'
                        key: {
                            name: 'x_nowrfid_scan_batch'
                            element: 'notes'
                        }
                    },
                    {
                        table: 'ua_table_licensing_config'
                        id: 'c656db9188ea41988d9d3b591a3debb2'
                        key: {
                            name: 'x_nowrfid_scan_item'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'c769271060f54aac865d3dc34ae0f334'
                        key: {
                            name: 'x_nowrfid_scan_batch'
                            element: 'status'
                            value: 'new'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'c9fc7efcd80d4dd8821f146f5e24e91b'
                        key: {
                            name: 'x_nowrfid_scan_batch'
                            element: 'location'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'cc98b82afd07455c88e43cc0f5c76439'
                        key: {
                            sys_security_acl: 'b385f5a224c64fb9a1bc36f2f13710b5'
                            sys_user_role: {
                                id: '8ceb2309ca854833941f96b5a4d2147e'
                                key: {
                                    name: 'x_nowrfid.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_number'
                        id: 'ce5a74424b5a4e03acc92adcb28a9505'
                        key: {
                            category: 'x_nowrfid_scan_batch'
                            prefix: 'RFB'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'ce9f8763ac1c4311baaeb03c97599811'
                        key: {
                            sys_security_acl: '8635606eb702499194ba6853f24ed3ef'
                            sys_user_role: {
                                id: '71397305bd134cbb9ade356710f91fb3'
                                key: {
                                    name: 'x_nowrfid.integration'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'd00d0f5ad8374802ab013ebe4cfd26a5'
                        key: {
                            name: 'x_nowrfid_scan_item'
                            element: 'tid'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'd6a8d4f54e8a4f3a8b23358ceb84c19a'
                        key: {
                            name: 'x_nowrfid_scan_item'
                            element: 'matched_asset'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'd8c01f6662ef41fe89b19813b7fd6133'
                        key: {
                            name: 'x_nowrfid_scan_item'
                            element: 'match_status'
                            value: 'created'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'd9fbc45aec0b4f93b19ea1d8aaf41054'
                        key: {
                            name: 'x_nowrfid_scan_batch'
                            element: 'device_id'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'dd05b60be053403b920fdfe7084a64bb'
                        key: {
                            name: 'x_nowrfid_scan_item'
                            element: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'e13f19eb73f048a09de1fd0023284b2f'
                        key: {
                            name: 'x_nowrfid_scan_item'
                            element: 'capture_type'
                            value: 'rfid'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'e77931636b1a4074817bf05e0eb444ed'
                        key: {
                            name: 'x_nowrfid_scan_item'
                            element: 'capture_type'
                            value: 'barcode'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'f04627f36a3c430e9130f8a27c854d17'
                        key: {
                            name: 'x_nowrfid_scan_batch'
                            element: 'NULL'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'f24b0afb5f994c698a7e6376fee4e6d0'
                        key: {
                            name: 'x_nowrfid_scan_batch'
                            element: 'reader_mac'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'f562416dc6004c4ab8c00ec90465eccf'
                        key: {
                            name: 'x_nowrfid_scan_batch'
                            element: 'department'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'f6fd76235b404f739e941bfda043369c'
                        key: {
                            name: 'x_nowrfid_scan_item'
                            element: 'tid'
                        }
                    },
                    {
                        table: 'sys_db_object'
                        id: 'f9724795b712427698c4167239561506'
                        key: {
                            name: 'x_nowrfid_scan_batch'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'fdc868e437314de0b56b1c7cd7424bbd'
                        key: {
                            name: 'x_nowrfid_scan_batch'
                            element: 'app_version'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'fdec1ba10c1844588442b40bdd8fed28'
                        key: {
                            name: 'x_nowrfid_scan_item'
                            element: 'capture_type'
                        }
                    },
                ]
            }
        }
    }
}
