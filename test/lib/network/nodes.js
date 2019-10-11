const subject = require('../../../lib/network/nodes');


let config;

describe('nodes', () => {
  beforeEach(() => {
    config = {
      nodes: 10,
      remote: {
        clusters: [
          {location: 'location1'},
          {location: 'location2'}
        ]
      }
    };
  });

  describe('partition', () => {
    it('should return an array with as many elements as clusters', () => {
      const clusterFixtures = [
        [],
        [
          {location: 'location1'},
          {location: 'location2'}
        ],
        [
          {location: 'location1'},
          {location: 'location2'},
          {location: 'location3'},
          {location: 'location4'},
          {location: 'location5'},
          {location: 'location6'}
        ],
        [
          {location: 'location1'}
        ]
      ];

      clusterFixtures.forEach((fixture) => {
        config.remote.clusters = fixture;

        const expected = fixture.length;
        const actual = subject.partition(config).length;

        actual.should.eq(expected);
      })
    });

    it('should return the number of nodes per cluster with no remainder', () => {
      const expected = [5, 5];
      const actual = subject.partition(config);

      actual.length.should.eq(expected.length);
      actual[0].should.eq(expected[0]);
      actual[1].should.eq(expected[1]);
    });

    it('should return the number of nodes per cluster with remainder', () => {
      config.nodes = 17;
      config.remote.clusters = [
        {location: 'location1'},
        {location: 'location2'},
        {location: 'location3'}
      ]

      const expected = [6, 6, 5];
      const actual = subject.partition(config);

      actual.length.should.eq(expected.length);
      actual[0].should.eq(expected[0]);
      actual[1].should.eq(expected[1]);
    });
  });
});
