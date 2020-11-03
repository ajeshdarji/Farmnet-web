const { response } = require('express');
const verifyLogin=(req,res,next)=>{
  if(req.session.loggedIn){
     next()
  }else{
    res.redirect('/login')
  }
}
var express = require('express');
var router = express.Router();
var productHelpers=require('../helpers/product-helpers')
var userHelpers=require('../helpers/user-helpers')
/* GET home page. */
router.get('/', async function(req, res, next) {
  let user=req.session.user
  let cartCount=null
  if(req.session.user){
  cartCount=await userHelpers.getCartCount(req.session.user._id)
  }
  productHelpers.getAllProducts().then((products)=>{
   res.render('user/view-products',{products,user,cartCount})
   console.log(cartCount)
  })
 });
 router.get('/login',(req,res)=>{
   if(req.session.loggedIn){
    res.redirect('/')
   }else{
   res.render('user/login',{"loginErr":req.session.loginError})
   req.session.loginErr=""
   }
 })
 router.get('/signup',(req,res)=>{
  res.render('user/signup')
})
router.post('/signup',(req,res)=>{
  userHelpers.doSignup(req.body).then((response)=>{
    req.session.loggedIn=true
    req.session.user=response
    res.redirect('/')
  })
  
})
router.post('/login',(req,res)=>{
  userHelpers.doLogin(req.body).then((response)=>{
    if(response.status){
      req.session.loggedIn=true
      req.session.user=response.user
      res.redirect('/')
    }else{
      req.session.loginError="Inavalid username or password"
      res.redirect('/login')
    }
  })
  
})
router.get('/logout',(req,res)=>{
  req.session.destroy();
  res.redirect('/')
})

router.get('/cart',verifyLogin,async(req,res,next)=>{
  let user=req.session.user
  let cartCount=await userHelpers.getCartCount(req.session.user._id)
  let products=await userHelpers.getCartProducts(req.session.user._id)
  if(cartCount==0){
    res.redirect('/')
  }
  else{
    let totalValue=await userHelpers.getTotalAmount(req.session.user._id)
    res.render('user/cart',{products,user,totalValue})
  }
})

router.get('/add-to-cart/',verifyLogin,(req,res)=>{
  userHelpers.addToCart(req.query.id,req.session.user._id).then(()=>{
    res.redirect('/')
  })
})
router.post('/change-product-quantity',(req,res,next)=>{
  userHelpers.changeProductQuantity(req.body).then(async(response)=>{
    response.total=await userHelpers.getTotalAmount(req.body.user)
       res.json(response)
  })
})
router.get('/place-order',verifyLogin,async(req,res)=>{
  let total=await userHelpers.getTotalAmount(req.session.user._id)
  res.render('user/checkout',{total,user:req.session.user})
})
router.post('/place-order',async(req,res)=>{
  let products=await userHelpers.getCartList(req.body.userId)
  let total=await userHelpers.getTotalAmount(req.body.userId)
  userHelpers.checkout(req.body,products,total).then((orderId)=>{
    if(req.body['payment-method']==='COD'){
        res.json({codsuccess:true})
    }else{
      userHelpers.generateRazorpay(orderId,total).then((response)=>{
           res.json(response)
      })
    }
  })
  console.log(req.body,products,total)
})
router.get('/success',verifyLogin,(req,res)=>{
  res.render('user/success',{user:req.session.user})
})
router.get('/orders',async(req,res)=>{
  let orders= await userHelpers.getOrders(req.session.user._id)
  res.render('user/orders',{user:req.session.user,orders})
})
router.post('/verify-payment',(req,res)=>{
  console.log(req.body)
  userHelpers.verifyPayment(req.body).then(()=>{
    userHelpers.changePaymentStatus(req.body['order[receipt]']).then(()=>{
      console.log("payment success")
      res.json({status:true})
    })
  }).catch((err)=>{
    console.log(err);
    res.json({status:"payment failed",errMsg:''})
  })
})

module.exports = router;
