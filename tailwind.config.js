/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./{index.html,index.js}"],
  theme: {
    extend: {
      fontFamily:{
        custom:['jet','sans'],
        scanbold:['scanbold','sans']
      }
    },
  },
  plugins: [],
}
