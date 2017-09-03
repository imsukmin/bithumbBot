const TelegramBot = require('node-telegram-bot-api')
const bithumbapi = require('bithumbapi')
const Bithumb = new bithumbapi() // public API only

const config = require('./config')

// polyfill
Number.isInteger = Number.isInteger || function(value) {
  return typeof value === "number" && 
         isFinite(value) && 
         Math.floor(value) === value
}

if (!Array.isArray) {
  Array.isArray = function(arg) {
    return Object.prototype.toString.call(arg) === '[object Array]';
  };
}

const isNotCurrency = function(c) {
  // c ==> BTC, ETH, DASH, LTC, ETC, XRP, BCH, XMR (기본값: BTC), ALL(전체)
  c = c.toUpperCase()
  return (c !== 'BTC' && c !== 'ETH' && c !== 'DASH' && c !== 'LTC' && c !== 'ETC' && c !== 'XRP' && c !== 'BCH' && c !== 'XMR' )
}

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(config.token, { polling: true })

const bithumbTicker = function (currency, chatID) {
  if(isNotCurrency(currency) && currency !== 'all') {
    console.warn('bithumbTicker: currency type is NOT correct! [ currency: ' + currency + ']')
    currency = 'btc'
  }
  Bithumb.ticker(currency)
    .then(function (response) {
      bot.sendMessage(chatID, currency.toUpperCase() + ' now currenct: ' + response.data.data.closing_price)
    })
    .catch(function (error) {
      console.log('[bithumbTicker]', error);
    })
}

const bithumbOrderbook = function (currency, chatID) {
  if(isNotCurrency(currency)) {
    console.warn('bithumbOrderbook: currency type is NOT correct! [ currency: ' + currency + ']')
    currency = 'btc'
  }
  Bithumb.orderbook(currency)
  .then(function (response) {
    var recentCount = 10
    var getBuyerList = response.data.data.bids
    var getSellerList = response.data.data.asks
    var buyerList = getBuyerList.splice(0, recentCount)
    var sellerList = getSellerList.splice(0, recentCount)
    var sendMessageText = '--------------------[SELLER]\n'
    for (var i = sellerList.length - 1; i >= 0; i--) {
      sendMessageText += ( 'price: ' + sellerList[i].price + ', qty: ' + sellerList[i].quantity + '\n' )
    }
    sendMessageText += '--------------------[BUYER]\n'
    for (var i = 0; i < buyerList.length; i++) {
      sendMessageText += ( 'price: ' + buyerList[i].price + ', qty: ' + buyerList[i].quantity + '\n' )
    }

    // console.log(sendMessageText)
    bot.sendMessage(chatID, sendMessageText)
  })
  .catch(function (error) {
    console.log('[bithumbOrderbook]', error);
  })
}


const bithumbTransction = function (currency, chatID) {
  if(isNotCurrency(currency)) {
    console.warn('bithumbTransction: currency type is NOT correct! [ currency: ' + currency + ']')
    currency = 'btc'
  }
  Bithumb.transactions(currency)
    .then(function (response) {
      var recentCount = 10
      var tradeList = response.data.data
      var recentTradeList = tradeList.splice(tradeList.length - recentCount, recentCount)
      var sendMessageText = ''
      for (var key in recentTradeList) {
        sendMessageText += ( '[' + (recentTradeList[key].type==='bid'?'구매↑':'판매↓') + '] price: ' + recentTradeList[key].price + ', qty: ' + recentTradeList[key].units_traded + '\n' )
      }
      bot.sendMessage(chatID, sendMessageText)
    })
    .catch(function (error) {
      console.log('[bithumbTransction]', error);
    })
}

// system message
const sendHelpMessage = function (chatID) {
  var sendMessageText =
    '안녕하세요 빗썸봇입니다. 명령어 설명드리겠습니다.\n\n'
    + '/help : 현재 보고 계시는 명령어를 보실 수 있습니다.\n'
    + '/btcnow : 비트코인의 현재가격을 보여줍니다.\n'
    + '/bchnow : 비트코인캐시의 현재가격을 보여줍니다.\n'
    + '/ethnow : 이더리움의 현재가격을 보여줍니다.\n'
    + '/etcnow : 이더리움클래식의 현재가격을 보여줍니다.\n'
    + '/xrpnow : 리플의 현재가격을 보여줍니다.\n'
    + '/dashnow : 대시코인의 현재가격을 보여줍니다.\n'
    + '/ltcnow : 라이트코인의 현재가격을 보여줍니다.\n'
    + '/xmrnow : 모네로의 현재가격을 보여줍니다.\n'
    + '/btctraded : 비트코인의 최근 거래내역 10개를 보여줍니다.\n'
    + '/bchtraded : 비트코인캐시의 최근 거래내역 10개를 보여줍니다.\n'
    + '/ethtraded : 이더리움의 최근 거래내역 10개를 보여줍니다.\n'
    + '/etctraded : 이더리움클래식의 최근 거래내역 10개를 보여줍니다.\n'
    + '/xrptraded : 리플의 최근 거래내역 10개를 보여줍니다.\n'
    + '/dashtraded : 대시코인의 최근 거래내역 10개를 보여줍니다.\n'
    + '/ltctraded : 라이트코인의 최근 거래내역 10개를 보여줍니다.\n'
    + '/xmrtraded : 모네로의 최근 거래내역 10개를 보여줍니다.\n'
    + '/btcorder : 비트코인의 현재 시장상황을 보여줍니다.\n'
    + '/bchorder : 비트코인캐시의 현재 시장상황을 보여줍니다.\n'
    + '/ethorder : 이더리움의 현재 시장상황을 보여줍니다.\n'
    + '/etcorder : 이더리움클래식의 현재 시장상황을 보여줍니다.\n'
    + '/xrporder : 리플의 현재 시장상황을 보여줍니다.\n'
    + '/dashorder : 대시코인의 현재 시장상황을 보여줍니다.\n'
    + '/ltcorder : 라이트코인의 현재 시장상황을 보여줍니다.\n'
    + '/xmrorder : 모네로의 현재 시장상황을 보여줍니다.\n'
    + '\n이상입니다 채팅창에 "/" 표시를 누르시면 사용하기 편리하니 참고해주세요.'
    + '\n문의 사항이 있으시면 @idiotsound로 문의 부탁드립니다'

  bot.sendMessage(chatID, sendMessageText, {
      // 키보드 봉인
      // reply_markup: {
      //   keyboard: [
      //     [{text: '/btcnow'}, {text: '/bchnow'}, {text: '/ethnow'}, {text: '/etcnow'}, {text: '/xrpnow'}],
      //     [{text: '/btctraded'}, {text: '/bchtraded'}, {text: '/ethtraded'}, {text: '/etctraded'}, {text: '/xrptraded'}],
      //     [{text: '/btcorder'}, {text: '/bchorder'}, {text: '/ethorder'}, {text: '/etcorder'}, {text: '/xrporder'}],
      //   ],
      //   resize_keyboard: true
      // }
    })
}

// Listen for any kind of message. There are different kinds of messages.
bot.on('message', function (msg) {
  try {
    var chatID = msg.chat.id
    var message = msg.text
    if (msg.document) {
      // message with file
    } else if (msg.photo) {
      // message with photo
    } else if (message) {
      // var name = msg.from.first_name
      // if (msg.from.last_name !== undefined){
      //   name = name + ' ' + msg.from.last_name
      // }

      if (/\/start/.test(message)) { sendHelpMessage(chatID)
      } else if (/\/help/.test(message)) { sendHelpMessage(chatID)
      } else if (/\/btcnow/.test(message)) { bithumbTicker('btc', chatID)
      } else if (/\/bchnow/.test(message)) { bithumbTicker('bch', chatID)
      } else if (/\/ethnow/.test(message)) { bithumbTicker('eth', chatID)
      } else if (/\/etcnow/.test(message)) { bithumbTicker('etc', chatID)
      } else if (/\/xrpnow/.test(message)) { bithumbTicker('xrp', chatID)
      } else if (/\/dashnow/.test(message)) { bithumbTicker('dash', chatID)
      } else if (/\/ltcnow/.test(message)) { bithumbTicker('ltc', chatID)
      } else if (/\/xmrnow/.test(message)) { bithumbTicker('xmr', chatID)
      } else if (/\/btctraded/.test(message)) { bithumbTransction('btc', chatID)
      } else if (/\/bchtraded/.test(message)) { bithumbTransction('bch', chatID)
      } else if (/\/ethtraded/.test(message)) { bithumbTransction('eth', chatID)
      } else if (/\/etctraded/.test(message)) { bithumbTransction('etc', chatID)
      } else if (/\/xrptraded/.test(message)) { bithumbTransction('xrp', chatID)
      } else if (/\/dashtraded/.test(message)) { bithumbTransction('dash', chatID)
      } else if (/\/ltctraded/.test(message)) { bithumbTransction('ltc', chatID)
      } else if (/\/xmrtraded/.test(message)) { bithumbTransction('xmr', chatID)
      } else if (/\/btcorder/.test(message)) { bithumbOrderbook('btc', chatID)
      } else if (/\/bchorder/.test(message)) { bithumbOrderbook('bch', chatID)
      } else if (/\/ethorder/.test(message)) { bithumbOrderbook('eth', chatID)
      } else if (/\/etcorder/.test(message)) { bithumbOrderbook('etc', chatID)
      } else if (/\/xrporder/.test(message)) { bithumbOrderbook('xrp', chatID)
      } else if (/\/dashorder/.test(message)) { bithumbOrderbook('dash', chatID)
      } else if (/\/ltcorder/.test(message)) { bithumbOrderbook('ltc', chatID)
      } else if (/\/xmrorder/.test(message)) { bithumbOrderbook('xmr', chatID)
      }
    }
  } catch (error) {
    console.warn('[bot.on]', error)
  }
})
