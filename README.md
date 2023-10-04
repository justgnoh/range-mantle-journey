# range-mantle-journey

## Run tests

Writes results for each LP address into `results.json`

```bash
node mantle_lp.t.js
```

## Run Mantle Journey tracker

Calculates the number of valid LP positions a specified address has given the following condition:

- For each Range Protocol vault on Mantle, an LP with a liquidity position > 50 USD notional value will receive 10 MJ miles per valid vault LP

```bash
node mantle_lp.js <INSERT_ADDRESS_HERE>
```
