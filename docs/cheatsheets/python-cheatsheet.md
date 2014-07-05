# Prerequisites

* Python 2.7 or 3.4
* Virtualenv (python virtual environment utility)


## Getting set up

* Set up a virtual environment with `virtualenv .`
* Activate your environment with `source bin/activate`
* Grab the client with `pip install jsox-code-retreat`

## Starting a session

Tests and code live in the same file. To get started you might use the following template:

```python
cr path/to/my/session.py
```

## Running tests

Run `cr path/to/my/session.py`. The client will watch the file for changes and print the results to the terminal. When your tests fail the details will also be printed.

## Writing tests

We're using [pytest](http://pytest.org/latest/) which will be installed when you pip the runner.

Make sure your test functions start with `test_`.

py.test users bare asserts with standard python comparison operaters like so `assert 'foo' == 'foo'`.
