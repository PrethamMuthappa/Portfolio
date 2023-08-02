const stacks=document.getElementById('stack');
const pro=document.getElementById('pro');
const arrow=document.getElementById('arrow');
const logo=document.getElementById('logo');
const parents=document.getElementById('para');
const bor=document.getElementById('bor');
gsap.registerPlugin('ScrollTrigger');



  gsap.fromTo(parents,{

    opacity:0,

  },{
    opacity:1,
    delay:0,
    duration:0.3,

    scrollTrigger: {
        trigger: parents,
        start: "bottom bottom",
        end: "top 100px",
        //we can use scrub for do the reverse animation when going back 
        
        //scrub: true,
        //id: "scrub"
      
      }

  })
logo.addEventListener('pointerover',()=>{

    gsap.to(logo,{rotate:"360deg",yoyo:true,duration:1})
})

arrow.addEventListener('pointerover',()=>{

    gsap.to(arrow,{y:20,duration:1, ease:"bounce.out",yoyo:true ,repeat:-1})
})


window.addEventListener('load',()=>{

    gsap.fromTo(stacks,{x:-30,opacity:0,duration:1},{x:0,opacity:1,duration:1})
})


