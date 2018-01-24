const expect = require('expect')

export default function expectsRejection (res: Promise<any>): Promise<any> {
  return res.then(() => {
    throw new Error('errExpected')
  }).catch((e) => {
    if (e === 'errExpected') {
      throw new Error('An error was expected.')
    }

    expect(e instanceof Error).toBe(true)
  })
}
