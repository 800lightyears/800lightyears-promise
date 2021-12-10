const PENDING = 'pending',
  RESOLVED = 'fulFilled',
  REJECTED = 'rejected'

class MyPromise {
  constructor(executor) {
    this.state = PENDING
    this.value = undefined
    this.error = undefined
    this.onResolvedCB = []
    this.onRejectedCB = []

    try {
      executor(this.resolve, this.reject)
    } catch (err) {
      this.reject(err)
    }
  }

  isFun = (value) => typeof value === 'function'

  resolve = (val) => {
    if (this.state == PENDING) {
      this.state = RESOLVED
      this.value = val
      this.onResolvedCB.forEach((fn) => fn())
    }
  }

  reject = (err) => {
    if (this.state == PENDING) {
      this.state = REJECTED
      this.error = err
      this.onRejectedCB.forEach((fn) => fn())
    }
  }

  then = (onFulFilled, onRejected) => {
    onFulFilled = this.isFun(onFulFilled) ? onFulFilled : (data) => data
    onRejected = this.isFun(onRejected)
      ? onRejected
      : (err) => {
          throw err
        }

    const newPromise = new MyPromise((resolve, reject) => {
      switch (this.state) {
        case PENDING: {
          this.onResolvedCB.push(() => {
            setTimeout(() => {
              try {
                const x = onFulFilled(this.value)
                this.resolvePromise(newPromise, x, resolve, reject)
              } catch (err) {
                reject(err)
              }
            }, 0)
          })

          this.onRejectedCB.push(() => {
            setTimeout(() => {
              try {
                const x = onRejected(this.error)
                this.resolvePromise(newPromise, x, resolve, reject)
              } catch (err) {
                reject(err)
              }
            }, 0)
          })
          break
        }
        case RESOLVED: {
          setTimeout(() => {
            try {
              const x = onFulFilled(this.value)

              this.resolvePromise(newPromise, x, resolve, reject)
            } catch (err) {
              reject(err)
            }
          }, 0)
          break
        }
        case REJECTED: {
          setTimeout(() => {
            try {
              const x = onRejected(this.error)

              this.resolvePromise(newPromise, x, resolve, reject)
            } catch (err) {
              reject(err)
            }
          }, 0)
          break
        }
        default:
          null
      }
    })
    return newPromise
  }

  resolvePromise = (newPromise, x, resolve, reject) => {
    if (newPromise === x) {
      return reject(new TypeError('Cannot reference itself'))
    }

    if ((typeof x === 'object' && x != null) || typeof x === 'function') {
      let called

      try {
        const then = x.then

        if (typeof then === 'function') {
          then.call(
            x,
            (newX) => {
              if (called) return

              called = true
              this.resolvePromise(newPromise, newX, resolve, reject)
            },
            (err) => {
              if (called) return

              called = true
              reject(err)
            }
          )
        } else {
          if (called) return

          called = true
          resolve(x)
        }
      } catch (err) {
        if (called) return

        called = true
        reject(err)
      }
    } else {
      resolve(x)
    }
  }
}

Promise.defer = Promise.deferred = function () {
  let dfd = {}
  dfd.promise = new MyPromise((resolve, reject) => {
    dfd.resolve = resolve
    dfd.reject = reject
  })
  return dfd
}

module.exports = Promise
