const { response } = require('express');
var express = require('express');
const { render } = require('../app');
var router = express.Router();
var productHelpers=require('../helpers/product-helpers')
/* GET users listing. */
router.get('/', function(req, res, next) {
 productHelpers.getAllProducts().then((products)=>{
  res.render('admin/view-products',{admin:true,products})
 })
});
router.get('/add-products',(req,res)=>{
  res.render('admin/add-products')
})
router.post('/add-products',(req,res)=>{
  productHelpers.addProducts(req.body,(id)=>{
    let image=req.files.Image
    image.mv('../NODE/public/product-image/'+id+'.jpg',(err,done)=>{
      if(!err){
            res.render("admin/add-products")
      }
      else{
        console.log(err)
      }
    })
  })
})
router.get('/delete-product/',(req,res)=>{
  let proId= req.query.id
  console.log(proId)
  productHelpers.deleteProduct(proId).then((response)=>{
    res.redirect("/admin")
  })
})
router.get('/edit-product/',async (req,res)=>{
  let product=await productHelpers.getProductDetails(req.query.id)
  res.render("admin/edit-product",{product})
})
router.post('/edit-product/',(req,res)=>{
  productHelpers.updateproduct(req.query.id,req.body).then((response)=>{
    res.redirect('/admin')
    if(req.files.Image){
      let image=req.files.Image
      image.mv('../NODE/public/product-image/'+req.query.id+'.jpg')
    }
  })
})
module.exports = router;