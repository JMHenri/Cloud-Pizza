## Instructions for running the tactacam cloud pizza delivery.
---
### Intro
The cloud pizza ordering service will be running on AWS, and deployed using cloudformation. 

All commands in this project are identical to the "The-state-machine" project.

Setup remains the same as the "The-state-machine" project.

The new state machine checks whether or not stores are open. Stores are open on even numbered epoch times.
It also checks customer address information, it cannot deliver pizzas to houses, only to the internet, so it makes sure that the address type is not physical.

### Example data
Example of a successful request.
```javascript
{
    "customerInfo": {
      "addressType": "email"
    }
}
```
```javascript

Example of an usuccessful request.
{
    "customerInfo": {
      "addressType": "physical"
    }
}
```

### Todos
- Fix up the double usage of node.js requires and ES6 import/export with the lambda functions to allow for unit testing.