// const assert = require('assert')
// const fs = require('fs')
// const path = require('path')

// const Gzipper = require('../Gzipper')

// const RESOURCES_PATH = path.resolve(__dirname, './resources')

// describe('Gzipper', () => {
//   describe('verbose', () => {
//     beforeEach(() => removeGzippedFiles())

//     it('should print logs to console about every file', () => {
//       const options = { verbose: true }
//       new Gzipper(RESOURCES_PATH, null, options).compress()
//       this.timeout(100)
//       assert.equal()
//     })
//   })
// })

// function removeGzippedFiles() {
//   fs.readdir(RESOURCES_PATH, (err, files) => {
//     if (err) throw err

//     for (const file of files) {
//       fs.unlink(path.join(RESOURCES_PATH, file), err => {
//         if (err) throw err
//       })
//     }
//   })
// }
