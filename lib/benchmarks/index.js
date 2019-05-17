const { FinalityBenchmarks } = require('./strategies/finality');


class Benchmarks{
  constructor(config) {
    this.config = config;

    this._runner = this._strategy();
  }

  _strategy() {
    // single strategy for now
    return new FinalityBenchmarks(this.config);
  }

  async metrics() {
    return this._runner.metrics();
  }
}

module.exports = {
  Benchmarks
}
