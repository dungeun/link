# Page snapshot

```yaml
- alert
- dialog "Server Error":
  - navigation:
    - button "previous" [disabled]:
      - img "previous"
    - button "next" [disabled]:
      - img "next"
    - text: 1 of 1 error
  - heading "Server Error" [level=1]
  - paragraph: "TypeError: Cannot read properties of undefined (reading 'call')"
  - text: This error happened while generating the page. Any console logs will be displayed in the terminal window.
  - heading "Call Stack" [level=2]
  - group:
    - img
    - img
    - text: Next.js
  - heading "JSON.parse" [level=3]
  - text: <anonymous>
  - group:
    - img
    - img
    - text: Next.js
```