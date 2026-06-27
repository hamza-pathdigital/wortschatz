describe('jest setup', () => {
  it('localStorage mock is available', () => {
    localStorage.setItem('test', 'value')
    expect(localStorage.getItem('test')).toBe('value')
    localStorage.clear()
  })
})
