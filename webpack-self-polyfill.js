// webpack-self-polyfill.js
class SelfPolyfillPlugin {
  apply(compiler) {
    compiler.hooks.compilation.tap('SelfPolyfillPlugin', (compilation) => {
      compilation.hooks.optimizeChunkAssets.tap('SelfPolyfillPlugin', (chunks) => {
        for (const chunk of chunks) {
          if (chunk.name === 'vendor') {
            // Prepend self polyfill to vendor chunk
            const files = chunk.files;
            for (const file of files) {
              if (file.endsWith('.js')) {
                const asset = compilation.assets[file];
                const source = asset.source();
                const newSource = `if (typeof self === 'undefined') { global.self = global; }\n${source}`;
                compilation.assets[file] = {
                  source: () => newSource,
                  size: () => newSource.length
                };
              }
            }
          }
        }
      });
    });
  }
}

module.exports = SelfPolyfillPlugin;