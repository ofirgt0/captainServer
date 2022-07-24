const fs = require('fs')
const Sharp = require('sharp');
 function escapeParameter(zz){ 
  return zz;
    if(!zz || typeof zz !== 'string'){
      return zz;
      
    } 
    // console.log('zz ===',zz1);
    
    
    
    // console.log('zz ===',zz);
    const arrreplase = [
      ['<%',,""],
      ['%>',,""],
      ['<\\?',,""],
      ['\\?>',,""],
      ["'",,"&#39;"],
      ['%',,"&#37;"],
      ['%00',,""],
      ['""',,"&quot;"],
      ["union ","union",""],
      ["cast","cast ","ca<span>st</span> "],
      ["cast\\(","cast(",""],
      ["select ","s<span>ele</span>ct",""],
      ["convert ","co<span>nve</span>rt",""],
      ["update","<span>upd</span>ate",""],
      ["delete","<span>de</span><span>let</span>e",""],
      ["insert","<span>in</span><span>se</span>rt",""],
      ["distinct","distinct","di<span>sti</span>nct"],
      ["where","where","wh<span>er</span>e"],
      ["order by","order by",""],
      ["join","join","j<span>oi</span>n"],
      ["from","from","f<span>r</span>om"],
      ["create","create","c<span>re</span>ate"],
      ["into","into","i<span>nt</span>o"],
      ["view ","view","v<span>i</span>ew"],
      [" database","database","da<span>taba</span>se"],
      [" table","table","ta<span>b</span>le"],
      ["null","null",""],
      ["unique","unique","u<span>niq</span>ue"],
      ["check","check","c<span>h</span>eck"],
      ["drop ","drop","d<span>r</span>op"],
      ["alter ","alter",""],
      ["onerror","onerror","o<span>ner</span>ror"],
      ["javascript","javascript","j<span>av</span>a"],
      ["onmouse","onmouse","<span></span>"],
      ["onclick","onclick","<span></span>"],
      ["function","function","fu<span>nct</span>ion"],
      ["onfocus","onfocus","<span></span>"],
      ["onblur","onblur","<span></span>"],
      ["onload","onload","<span></span>"],
      ["onsubmit","onsubmit","<span></span>"],
      ["alert","alert","al<span>er</span>t"],
      ["document.","document.","docu<span>ment</span>."],
      ["cookie","cookie","coo<span>ki</span>e"]
    ];
    
    for(let el of arrreplase){
        zz=zz.replace(new RegExp(el[0].trim(), 'ig'),el[2]);
    }
    return zz;  
  }
  
  
 function  escapeParameters(params){
    // console.log('escapeParameters',params);
      for(var key in params) {
        if(! params[key]) continue;
        // console.log(key, params[key]);
        if(typeof params[key] == 'object' && Object.keys(params[key]).length>0){
          params[key] = escapeParameters(params[key]);
        }else{
          params[key] = escapeParameter(params[key]);
        }
      }
    return params;
  }
  


  
 function checkUpload(req, res) {

  // console.log('req.path = ' , req.path);
  // if(req.path.endsWith('null')){
  //   req.path = "a.jpg"
  // }

  let imgURL = path.resolve(__dirname + req.baseUrl + './../../../uploads/' + req.path) 
  let format = (path.parse(req.path).ext).substring(1)


  // מצב שמגיע תמונה בלי סיומת
  if(!format){
    imgURL = imgURL + '.jpg'
    format = 'jpg'
  }
  
  width = parseInt(req.query.w)
  height = parseInt(req.query.h)


  if(!fs.existsSync(imgURL)){
    // אם לא נמצאה תמונה מחזיר תמונה דיפולט
    imgURL = path.resolve(__dirname + req.baseUrl + './../../../uploads/' + 'Iska-Default-image.jpg') 
    
    if(isNaN(width) || isNaN(height) || width==0 || height==0){

      // -- מחזיר תמונה מקורית --
      console.log("-- returning original photo (1)--", req.query.w, req.query.h, width, height)
      res.sendFile(imgURL)  
      return
    }

    const stream = fs.createReadStream(imgURL);
    const transform = Sharp().resize(width, height, {
      fit: 'cover'
    }).toFormat(format, {
      quality: parseInt(100)
    });
    res.set('Content-Type', `image/${format}`);
    stream.pipe(transform).on('error', (e) => {
      console.log(e);
      res.sendFile(imgURL)  
      return
    }).pipe(res);
    return stream;
  
  }

  

 

  // res.sendFile(imgURL)  
  // return
  // אם לא סיפקו פרמטרים גובה ורוחב מבוקש להחזיר את התמונה המקורית
  if(isNaN(width) || isNaN(height) || width==0 || height==0){

    // -- מחזיר תמונה מקורית --
    console.log("-- returning original photo (1)--", req.query.w, req.query.h, width, height)
    res.sendFile(imgURL)  
  }else{
 
    // -- מעבד את התמונה לפי הדרישות והמידות\יחס שלה ומחזיר תמונה מותאמת לתצוגה שביקשו --

    const stream = fs.createReadStream(imgURL);
    const transform = Sharp().resize(width, height, {
      fit: 'cover'
    }).toFormat(format, {
      quality: parseInt(100)
    });
    res.set('Content-Type', `image/${format}`);
    stream.pipe(transform).on('error', (e) => {
      console.log(e);
      res.sendFile(imgURL)  
      return
    }).pipe(res);
    return stream;
  }

}

module.exports = {
    escapeParameters,
    checkUpload
}