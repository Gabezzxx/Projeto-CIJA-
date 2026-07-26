module.exports = {
  presets: ['@babel/preset-env', '@babel/preset-react'], 
  plugins: [
    '@babel/plugin-transform-classes' // Adiciona o plugin caso o projeto realmente precise dele
  ],
  ignore: [
    "./node_modules" // < Impede que o Babel tente compilar dependências externas
  ]
};