var express = require('express');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var phantom = require('phantom');
const axios = require('axios');



var json = []
// takeScreenShot = async (url, name) => {
//   const instance = await phantom.create();
//   const page = await instance.createPage();
//   const status = await page.open(url)
//   await page.render(`public/images/${name}`)
//   await instance.exit()
// }

// EXTRACT TEXT WHEN URL IS FINDED

async function takeText(link_src, company, id){
  let jsonLoc
  const instance = await phantom.create();
  const page = await instance.createPage();
  await page.on('onResourceRequested', function(requestData) {
    // console.info('Requesting', requestData.url);
  });
  const status = await page.open(link_src);
  const content = await page.property('content');
  await page.evaluate(function() {
    return $(".single-news-content p").text()
  }).then(function(text){
    //  var text1 = text.replace(/[\t\n\r]/gm,'').trim()
     jsonLoc = { link_src , text }
  });
  await instance.exit();
  return jsonLoc
}

function getNewsInformer($keywords,company,id){
  var json1 = []
  var url = "https://informer.rs/"
  // var keyword = req.body.keyword.split(' ').join('-')
  request(url, async function (error, response, html) {
    if (!error) {
      var $ = cheerio.load(html);
      for (i in $keywords) {
        await $(`.news-title:contains('${$keywords[i]}')`.toLowerCase()).each(function () {
            var text = $(this).text().replace(/[\t\n\r]/gm,'').trim()
            var lastParent = $(this).closest(':has(a)').find("a");
            var link = "https://informer.rs/"+ $(lastParent).attr('href');
            //  $(this).parents('td').last().addClass('active');
            json1.push({ text, link })
          })
          await $(`a[title*=${$keywords[i]}]`.toLowerCase()).each(function () {
            var text = $(this).text().replace(/[\t\n\r]/gm,'').trim()
            var link = "https://informer.rs/" + $(this).attr('href');
            json1.push({ text, link })
          })
  
          await $(`a[href*=${$keywords[i]}]`.toLowerCase()).each(function () {
            var text = $(this).text().replace(/[\t\n\r]/gm,'').trim()
            var link = "https://informer.rs/" + $(this).attr('href');
            var name = Math.random().toString(36).substring(7);
            json1.push({ text, link })
            //  PHANTOM JS SCREENSHOOT
            // takeScreenShot(link, name +".png");
          })
      }
      var result = json1.reduce((unique, o) => {
        if (!unique.some(obj => obj.link === o.link)) {
          unique.push(o);
        }
         return unique;
      }, []);
     
      const promises = []

      for (link of result){
        const  f =  takeText(link.link,company,id)
        promises.push(f)
      }
     
      Promise.all(promises).then(
       data => axios({
        method:'POST',
        url:'https://press-cliping.herokuapp.com/api/digitals',
        data:{
          company_id:id,
          media_slug:"informer",
          api_key:"sdsd",
          data: data
        }
      })
      .then(function (response) {
        console.log("RESPONSE FROM AXIOS INFORMER",response.data,company );
      })
     )

      // for (link of result){
      //    await takeText(link.link)
      // }
      // setTimeout( axios({
      //   method:'POST',
      //   url:'https://press-cliping.herokuapp.com/api/digitals',
      //   data:{
      //     company_id:id,
      //     media_slug:"informer",
      //     api_key:"sdsd",
      //     data: json
      //   }
      // })
      // .then(function (response) {
      //  console.log("RESPONSE FROM AXIOS INFORMER",response.data );
      // }),120000)
    } else {
      console.log("EROR", error)
    }
  });
}

module.exports.getNewsInformer = getNewsInformer;