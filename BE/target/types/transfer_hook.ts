export type TransferHook = {
    "version": "0.1.0",
    "name": "transfer_hook",
    "instructions": [
      {
        "name": "addWhitelist",
        "accounts": [
          {
            "name": "admin",
            "isMut": true,
            "isSigner": true
          },
          {
            "name": "amountPool",
            "isMut": true,
            "isSigner": false
          },
          {
            "name": "mint",
            "isMut": false,
            "isSigner": false
          }
        ],
        "args": [
          {
            "name": "address",
            "type": "publicKey"
          }
        ]
      },
      {
        "name": "removeWhitelist",
        "accounts": [
          {
            "name": "admin",
            "isMut": true,
            "isSigner": true
          },
          {
            "name": "amountPool",
            "isMut": true,
            "isSigner": false
          },
          {
            "name": "mint",
            "isMut": false,
            "isSigner": false
          }
        ],
        "args": [
          {
            "name": "address",
            "type": "publicKey"
          }
        ]
      },
      {
        "name": "updateAmount",
        "accounts": [
          {
            "name": "admin",
            "isMut": true,
            "isSigner": true
          },
          {
            "name": "amountPool",
            "isMut": true,
            "isSigner": false
          },
          {
            "name": "mint",
            "isMut": false,
            "isSigner": false
          }
        ],
        "args": [
          {
            "name": "address",
            "type": "publicKey"
          },
          {
            "name": "amount",
            "type": "u64"
          }
        ]
      },
      {
        "name": "initializeExtraAccountMetaList",
        "accounts": [
          {
            "name": "payer",
            "isMut": true,
            "isSigner": true
          },
          {
            "name": "extraAccountMetaList",
            "isMut": true,
            "isSigner": false
          },
          {
            "name": "mint",
            "isMut": false,
            "isSigner": false
          },
          {
            "name": "amountPool",
            "isMut": true,
            "isSigner": false
          },
          {
            "name": "tokenProgram",
            "isMut": false,
            "isSigner": false
          },
          {
            "name": "associatedTokenProgram",
            "isMut": false,
            "isSigner": false
          },
          {
            "name": "systemProgram",
            "isMut": false,
            "isSigner": false
          },
          {
            "name": "rent",
            "isMut": false,
            "isSigner": false
          }
        ],
        "args": []
      },
      {
        "name": "transferHook",
        "accounts": [
          {
            "name": "sourceToken",
            "isMut": false,
            "isSigner": false
          },
          {
            "name": "mint",
            "isMut": false,
            "isSigner": false
          },
          {
            "name": "destinationToken",
            "isMut": false,
            "isSigner": false
          },
          {
            "name": "owner",
            "isMut": false,
            "isSigner": false
          },
          {
            "name": "extraAccountMetaList",
            "isMut": false,
            "isSigner": false
          },
          {
            "name": "amountPool",
            "isMut": true,
            "isSigner": false
          }
        ],
        "args": [
          {
            "name": "amount",
            "type": "u64"
          }
        ]
      }
    ],
    "accounts": [
      {
        "name": "amountPool",
        "type": {
          "kind": "struct",
          "fields": [
            {
              "name": "whitelist",
              "type": {
                "vec": {
                  "defined": "SentAmount"
                }
              }
            }
          ]
        }
      }
    ],
    "types": [
      {
        "name": "SentAmount",
        "type": {
          "kind": "struct",
          "fields": [
            {
              "name": "address",
              "type": "publicKey"
            },
            {
              "name": "amount",
              "type": "u64"
            }
          ]
        }
      }
    ],
    "errors": [
      {
        "code": 6000,
        "name": "AddressAlreadyExist",
        "msg": "address already exist"
      },
      {
        "code": 6001,
        "name": "ExceedMaxAddress",
        "msg": "exceed max address"
      },
      {
        "code": 6002,
        "name": "InvalidAdminAddress",
        "msg": "invalid admin address"
      },
      {
        "code": 6003,
        "name": "NotExistAddress",
        "msg": "address don't exist in whitelist"
      }
    ]
  };
  
  export const IDL: TransferHook = {
    "version": "0.1.0",
    "name": "transfer_hook",
    "instructions": [
      {
        "name": "addWhitelist",
        "accounts": [
          {
            "name": "admin",
            "isMut": true,
            "isSigner": true
          },
          {
            "name": "amountPool",
            "isMut": true,
            "isSigner": false
          },
          {
            "name": "mint",
            "isMut": false,
            "isSigner": false
          }
        ],
        "args": [
          {
            "name": "address",
            "type": "publicKey"
          }
        ]
      },
      {
        "name": "removeWhitelist",
        "accounts": [
          {
            "name": "admin",
            "isMut": true,
            "isSigner": true
          },
          {
            "name": "amountPool",
            "isMut": true,
            "isSigner": false
          },
          {
            "name": "mint",
            "isMut": false,
            "isSigner": false
          }
        ],
        "args": [
          {
            "name": "address",
            "type": "publicKey"
          }
        ]
      },
      {
        "name": "updateAmount",
        "accounts": [
          {
            "name": "admin",
            "isMut": true,
            "isSigner": true
          },
          {
            "name": "amountPool",
            "isMut": true,
            "isSigner": false
          },
          {
            "name": "mint",
            "isMut": false,
            "isSigner": false
          }
        ],
        "args": [
          {
            "name": "address",
            "type": "publicKey"
          },
          {
            "name": "amount",
            "type": "u64"
          }
        ]
      },
      {
        "name": "initializeExtraAccountMetaList",
        "accounts": [
          {
            "name": "payer",
            "isMut": true,
            "isSigner": true
          },
          {
            "name": "extraAccountMetaList",
            "isMut": true,
            "isSigner": false
          },
          {
            "name": "mint",
            "isMut": false,
            "isSigner": false
          },
          {
            "name": "amountPool",
            "isMut": true,
            "isSigner": false
          },
          {
            "name": "tokenProgram",
            "isMut": false,
            "isSigner": false
          },
          {
            "name": "associatedTokenProgram",
            "isMut": false,
            "isSigner": false
          },
          {
            "name": "systemProgram",
            "isMut": false,
            "isSigner": false
          },
          {
            "name": "rent",
            "isMut": false,
            "isSigner": false
          }
        ],
        "args": []
      },
      {
        "name": "transferHook",
        "accounts": [
          {
            "name": "sourceToken",
            "isMut": false,
            "isSigner": false
          },
          {
            "name": "mint",
            "isMut": false,
            "isSigner": false
          },
          {
            "name": "destinationToken",
            "isMut": false,
            "isSigner": false
          },
          {
            "name": "owner",
            "isMut": false,
            "isSigner": false
          },
          {
            "name": "extraAccountMetaList",
            "isMut": false,
            "isSigner": false
          },
          {
            "name": "amountPool",
            "isMut": true,
            "isSigner": false
          }
        ],
        "args": [
          {
            "name": "amount",
            "type": "u64"
          }
        ]
      }
    ],
    "accounts": [
      {
        "name": "amountPool",
        "type": {
          "kind": "struct",
          "fields": [
            {
              "name": "whitelist",
              "type": {
                "vec": {
                  "defined": "SentAmount"
                }
              }
            }
          ]
        }
      }
    ],
    "types": [
      {
        "name": "SentAmount",
        "type": {
          "kind": "struct",
          "fields": [
            {
              "name": "address",
              "type": "publicKey"
            },
            {
              "name": "amount",
              "type": "u64"
            }
          ]
        }
      }
    ],
    "errors": [
      {
        "code": 6000,
        "name": "AddressAlreadyExist",
        "msg": "address already exist"
      },
      {
        "code": 6001,
        "name": "ExceedMaxAddress",
        "msg": "exceed max address"
      },
      {
        "code": 6002,
        "name": "InvalidAdminAddress",
        "msg": "invalid admin address"
      },
      {
        "code": 6003,
        "name": "NotExistAddress",
        "msg": "address don't exist in whitelist"
      }
    ]
  };
  