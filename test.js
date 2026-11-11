fetch("https://drive.google.com/uc?export=download&id=1lvBh8599MercSHmw_EzeniCP39vMbFFG")
  .then(res => { console.log(res.status, res.headers.get("content-type")); return res.text(); })
  .then(text => console.log("length:", text.length))
  .catch(console.error);
