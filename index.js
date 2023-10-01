const stacks=document.getElementById('stack');
const arrow=document.getElementById('arrow');

arrow.addEventListener('pointerover',()=>{

    gsap.to(arrow,{y:20,duration:1, ease:"bounce.out",yoyo:true ,repeat:-1})
})


window.addEventListener('load',()=>{

    gsap.fromTo(stacks,{x:-30,opacity:0,duration:1},{x:0,opacity:1,duration:1})
})

