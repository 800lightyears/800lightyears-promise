const PENDING = 'pending'
const RESOLVED = 'resolved'
const REJECTED = 'rejected'

class MyPromise {
  constructor(executor) {
    this.status = PENDING
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

  resolve = (val) => {
    if (this.status === PENDING) {
      this.status = RESOLVED
      this.value = val
      this.onResolvedCB.forEach((fn) => fn())
    }
  }

  reject = (err) => {
    if (this.status === PENDING) {
      this.status = REJECTED
      this.error = err
      this.onRejectedCB.forEach((fn) => fn())
    }
  }

  then = (onResolved, onRejected) => {
    onResolved = typeof onResolved === 'function' ? onResolved : (v) => v
    onRejected =
      typeof onRejected === 'function'
        ? onRejected
        : (e) => {
            throw e
          }

    const newPromise = new MyPromise((resolve, reject) => {
      let x
      switch (this.status) {
        case PENDING: {
          this.onResolvedCB.push(() => {
            setTimeout(() => {
              try {
                x = onResolved(this.value)
                this.resolvePromise(newPromise, x, resolve, reject)
              } catch (err) {
                reject(err)
              }
            }, 0)
          })
          this.onRejectedCB.push(() => {
            setTimeout(() => {
              try {
                x = onRejected(this.error)
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
              x = onResolved(this.value)
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
              x = onRejected(this.error)
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
      return reject(new TypeError(''))
    }

    if (x !== null && (typeof x === 'object' || typeof x === 'function')) {
      let called

      try {
        const then = x.then

        if (typeof then === 'function') {
          then.call(
            x,
            (v) => {
              if (called) return

              called = true
              this.resolvePromise(newPromise, v, resolve, reject)
            },
            (e) => {
              if (called) return

              reject(e)
            }
          )
        } else {
          resolve(x)
        }
      } catch (err) {
        if (called) return

        reject(err)
      }
    } else {
      resolve(x)
    }
  }

  catch = (onRejected) => this.then(undefined, onRejected)

  finally = (cb) =>
    this.then(
      (val) => MyPromise.resolve(cb()).then(() => val),
      (err) =>
        MyPromise.reject(cb()).then(() => {
          throw err
        })
    )

  all = (promises) => {
    if (!Array.isArray(promises) || !promises.length) throw new Error('')

    return new MyPromise((resolve, resject) => {
      let count = 0
      const len = promises.length,
        result = []

      for (let i = 0; i < len; i++) {
        Promise.resolve(promises[i]).then(
          (val) => {
            count++
            result[i] = val

            if (count === len) {
              resolve(result)
            }
          },
          (err) => {
            reject(err)
          }
        )
      }
    })
  }

  race = (promises) => {
    if (!Array.isArray(promises) || !promises.length) throw new Error('')

    return new MyPromise((resolve, reject) => {
      for (let i = 0; i < promises.length; i++) {
        MyPromise.resolve(promises[i]).then(
          (val) => {
            resolve(val)
          },
          (err) => {
            reject(err)
          }
        )
      }
    })
  }

  any = (promises) => {
    if (!Array.isArray(promises) || !promises.length) throw new Error('')

    return new MyPromise((resolve, reject) => {
      let len = promises.length
      const errs = []

      for (let i = 0; i < promises.length; i++) {
        MyPromise.resolve(promises[i]).then(
          (val) => {
            resolve(val)
          },
          (err) => {
            len--
            errs.push(err)

            if (!len) {
              reject(new AggregateError(errs))
            }
          }
        )
      }
    })
  }
}

MyPromise.deferred = function () {
  const result = {}

  result.promise = new MyPromise((resolve, reject) => {
    result.resolve = resolve
    result.reject = reject
  })

  return result
}

module.exports = MyPromise
