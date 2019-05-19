module.exports = class Compression {
  selectCompression() {
    throw new Error('Override selectCompression method in child class.')
  }
}
