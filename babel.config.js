module.exports = {
  presets: [
    '@babel/preset-env',
    '@babel/preset-react',
    '@babel/preset-typescript',
  ],
  plugins: [
    ['@babel/plugin-transform-typescript', {
      allowNamespaces: true
    }],
    '@babel/plugin-proposal-class-properties',
    '@babel/plugin-transform-regenerator',
    '@babel/plugin-transform-async-to-generator',
  ],
}