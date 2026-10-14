const sharp=require('sharp');
const mark='<path d="M320 670V410h80v42c30-40 70-52 121-40v84c-70-20-121 10-121 80v94z" fill="#17332F"/><rect x="552" y="588" width="82" height="82" rx="3" fill="#B84932"/>';
(async()=>{for(const [name,size,bg] of [['icon',1024,true],['adaptive-icon',1024,false],['splash',512,false],['favicon',64,true]]) await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">${bg?'<rect width="1024" height="1024" fill="#F8F5EF"/>':''}${mark}</svg>`)).resize(size,size).png().toFile('assets/brand/'+name+'.png');})();
