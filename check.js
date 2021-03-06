var express = require('express');
var request = require('request');
var url = require('url');
const querystring = require('querystring');
const token = require('./token.js');
const [AngleTokens,MasterTokens,HallTokens,InfoTokens] = [
    [token.AngleToken,token.AngleToken_2],
    [token.MasterToken,token.MasterToken_2],
    [token.HallToken,token.HallToken_2],
    [token.InfoToken,token.InfoToken_2]
]
var CHANNEL_ACCESS_TOKEN = HallTokens;

const { Pool } = require('pg');
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    //ssl: true,
});

const app = express(); //建立一個express 伺服器
app.post('/' , idleParser); // POST 方法**/

var dept ={
    'phys':[],
    'psy':[]
}

//1.send candidate:
psql("SELECT * FROM ACCOUNT WHERE head_url=\'https://i.imgur.com/tuwOCYc.jpg\';").then(
    members =>{        
        
        for(let member of members){
            let text ={
                "type":"text",
                "text":"下階段要開始了,請選擇圖片，否則您將使用預設圖片，有問題請洽詢問站"
            }
            pushmessage([text],member.angle_id)         
        }
        
    }
);
psql("SELECT * FROM ACCOUNT WHERE self_intro=\'none\';").then(
    members =>{        
        
        for(let member of members){
            let text ={
                "type":"text",
                "text":"下階段要開始了，請按按我註冊進行註冊，有問題請洽詢問站"
            }
            pushmessage([text],member.angle_id)
            setTimeout(()=>{
                let text = {
                    "type":"text",
                    "text":"請點選上面的按鈕，進到瀏覽器註冊，之後注意andriod手機請點選open in other app(如下圖)，iOS則不用"
                }
                let img = {
                    "type": "image",
                    "originalContentUrl": "https://i.imgur.com/rGsgMqc.jpg",
                    "previewImageUrl": "https://i.imgur.com/rGsgMqc.jpg"
                }
                let login_button ={
                    "type": "template",
                    "altText": "大講堂有消息，請借台手機開啟",
                    "template": {
                        "type": "buttons",
                        "thumbnailImageUrl": "https://i.imgur.com/XQgkcW5.jpg",
                        "imageAspectRatio": "rectangle",
                        "imageSize": "cover",
                        "imageBackgroundColor": "#FFFFFF",
                        "text": "按我註冊",
                        "defaultAction": {
                            "type": "uri",
                            "label": "註冊",
                            "uri": "https://angleline-hall.herokuapp.com/formhtml"
                        },
                        "actions": [
                            {
                              "type": "uri",
                              "label": "註冊",
                              "uri": "https://angleline-hall.herokuapp.com/formhtml"
                            }
                        ]
                    }
                }
                let relogin_button =
                    {
                        "type": "template",
                        "altText": "大講堂有消息，請借台手機開啟",
                        "template": {
                            "type": "buttons",                            
                            "text": "如果註冊失敗，可按我重新註冊",                            
                            "actions": [                                    
                                {
                                    "type": "uri",
                                    "label": "點我重新註冊",
                                    "uri":"https://angleline-hall.herokuapp.com/formhtml"     
                                }
                            ]
                        }
                };
                pushmessage([login_button,relogin_button,text,img],member.angle_id)
            },1000)         
        }
        
    }
);
//------------SQL----------------------

function psql(command){
   
    return new Promise((resolve,reject)=>{
        //while(is_conn_psql){console.log("(psql):pararell gate");};
        //if(!is_conn_psql){client.connect();is_conn_psql = true;}
        let recpt =[];
        let error;
        console.log("(psql):" + command );
        pool.connect()
        .then(client=>{            
            client.query(command)
            .then(res => {
                client.release();
                for (let row of res.rows) {                
                    recpt.push(row);
                    console.log( "(psql-query):"+ JSON.stringify(row));
                }
                resolve(recpt);
                for(let row of recpt){
                    console.log( "(psql-query-recpt):"+ JSON.stringify(row));
                }
                console.log( "(psql-query-recpt):"+ recpt.length);    
            })
            .catch(e => {client.release(); console.error("(psql):" + e.stack);reject(e);});            
        });
    });
  }

  function pushmessage(recpt,id){
      recpt.forEach(element => {
          console.log("pushmessage:"+element);
      });

      for(let token of CHANNEL_ACCESS_TOKEN){

        var options = {
            url: "https://api.line.me/v2/bot/message/push",
            method: 'POST',
            headers: {
              'Content-Type':  'application/json', 
              'Authorization':'Bearer ' + token
            },
            json: {
                "to": id.replace(/\s+/g, ""),
                'messages': recpt
            }
          };
            
          request(options, function (error, response, body) {
              if (error) throw error;
              console.log("(line)");
              console.log(body);
          });

      }
    
      
    
  }
  function idleParser(req ,res){
    
        //route
        //var nwimg;
        const domain="https://angleline.herokuapp.com";  
        //var adrr="/";
        
        // 定义了一个post变量，用于暂存请求体的信息
        var post = '';     
        // 通过req的data事件监听函数，每当接受到请求体的数据，就累加到post变量中
        req.on('data', function(chunk){   
            post += chunk;
        });
    
        // 在end事件触发后，通过querystring.parse将post解析为真正的POST请求格式，然后向客户端返回。
        req.on('end', function(){    
            post = JSON.parse(post);
            console.log(post.events[0]);
            var replyToken = post.events[0].replyToken;
            var posttype = post.events[0].type;
            /**var userMessage = post.events[0].message.text;
            console.log(replyToken);
            console.log(userMessage);**/
            if (typeof replyToken === 'undefined') {
                return;
            }        

            if (posttype == 'message'){            
                var msg = {
                    "type":"text",
                    "text":"抱歉，現在不能傳一般訊息!"
                }
                var msg2 = {
                    "type":"text",
                    "text":"有問題可以洽\"詢問台\"!"
                }
                replymessage([msg,msg2]);
            }
            if(posttype == 'postback'){
                var msg = {
                    "type":"text",
                    "text":"抱歉，請等待系統完成程序(一會兒後)，再按下按鈕!"
                }
                var msg2 = {
                    "type":"text",
                    "text":"有問題可以洽\"詢問台\"!"
                }
                replymessage([msg,msg2]);
            }
            function replymessage(recpt){ //recpt is message object

                for(let token of CHANNEL_ACCESS_TOKEN){

                    var options = {
                        url: "https://api.line.me/v2/bot/message/reply ",
                        method: 'POST',
                        headers: {
                        'Content-Type':  'application/json', 
                        'Authorization':'Bearer ' + token
                        },
                        json: {
                            'replyToken': replyToken,
                            'messages': recpt
                        }
                    };
                        
                    request(options, function (error, response, body) {
                        if (error) throw error;
                        console.log("(line)");
                        console.log(body);
                    });

                }
            
            
            }        
        });
       

}


//因為 express 預設走 port 3000，而 heroku 上預設卻不是，要透過下列程式轉換
var server = app.listen((process.env.PORT || 8080), function() {
    var port = server.address().port;
    console.log("App now running on port", port);
});
//!!!240