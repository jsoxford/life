# Prerequisites

* A relatively up-to-date installation of Ruby
* gem package manager


## Getting set up

Grab the client with `gem install coderetreat` (mac users will need to restart their terminal after this).

## Starting a session

Tests and code live in the same file. To get started you might use the following example:

```ruby
class CodeRetreat

  # the cell always dies, more like the game of death!
  def self.tickCell(cell)
    return false
  end

  # a rather patronising method!
  def self.truth
    true
  end

  # this one doesn't even work
  def self.falsehood
    true
  end
end

RSpec.describe CodeRetreat do
  it "#truth is true" do
    expect(CodeRetreat.truth).to eq(true)
  end

  it "#falsehood is false" do
    expect(CodeRetreat.falsehood).to eq(false)
  end
end
```

## Running tests

Run `cr your_code.rb`. The client will watch your code for changes and print the results to the terminal. When your tests fail the details will also be printed.

## Writing tests

Write your tests with [RSpec](http://rspec.info/).

[Better specs](http://betterspecs.org/) may also be useful.
