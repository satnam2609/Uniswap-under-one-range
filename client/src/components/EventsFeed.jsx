import { ethers } from "ethers";
import { useContext, useEffect, useReducer, useState } from "react";
import { MetaMaskContext } from "../contexts/MetaMask";
import config from "../config.js";
import PoolABI from "../abi/Pool.json";

const getEvents = (pool) => {
  return Promise.all([
    pool.queryFilter("Mint", "earliest", "latest"),
    pool.queryFilter("Swap", "earliest", "latest"),
  ]).then(([mints, swaps]) => {
    return Promise.resolve((mints || []).concat(swaps || []));
  });
};

const subscribeToEvents = (pool, callback) => {
  pool.on("Mint", (a, b, c, d, e, f, g, event) => callback(event));
  pool.on("Swap", (a, b, c, d, e, f, g, event) => callback(event));
};

const renderAmount = (amount) => {
  return ethers.utils.formatUnits(amount);
};

const renderMint = (args) => {
  return (
    <span>
      <strong>Mint</strong>
      [range: [{args.tickLower}-{args.tickUpper}], amounts: [
      {renderAmount(args.amount0)}, {renderAmount(args.amount1)}]]
    </span>
  );
};

const renderSwap = (args) => {
  return (
    <span>
      <strong>Swap</strong>
      [amount0: {renderAmount(args.amount0)}, amount1:{" "}
      {renderAmount(args.amount1)}]
    </span>
  );
};

const renderEvent = (event, i) => {
  let content;

  switch (event.event) {
    case "Mint":
      content = renderMint(event.args);
      break;

    case "Swap":
      content = renderSwap(event.args);
      break;

    default:
      return;
  }

  return <li key={i}>{content}</li>;
};

const isMintOrSwap = (event) => {
  return event.event === "Mint" || event.event === "Swap";
};

const cleanEvents = (events) => {
  return events
    .sort((a, b) => b.blockNumber - a.blockNumber)
    .filter((el, i, arr) => {
      return (
        i === 0 ||
        el.blockNumber !== arr[i - 1].blockNumber ||
        el.logIndex !== arr[i - 1].logIndex
      );
    });
};

const eventsReducer = (state, action) => {
  switch (action.type) {
    case "add":
      return cleanEvents([action.value, ...state]);

    case "set":
      return cleanEvents(action.value);

    default:
      return;
  }
};

const EventsFeed = () => {
  const metamaskContext = useContext(MetaMaskContext);
  const [events, setEvents] = useReducer(eventsReducer, []);
  const [pool, setPool] = useState();

  useEffect(() => {
    if (metamaskContext.status !== "connected") {
      return;
    }

    if (!pool) {
      const newPool = new ethers.Contract(
        config.poolAddress,
        PoolABI,
        new ethers.providers.Web3Provider(window.ethereum)
      );

      subscribeToEvents(newPool, (event) =>
        setEvents({ type: "add", value: event })
      );

      getEvents(newPool).then((events) => {
        setEvents({ type: "set", value: events });
      });

      setPool(newPool);
    }
  }, [metamaskContext.status, events, pool]);

  return (
    <div className="px-5 py-4 bg-white/50 mt-5 rounded-lg">
      <p className="text-4xl font-bold text-slate-50">Events</p>
      <ul className="py-6 text-lg   text-slate-100">
        {events.filter(isMintOrSwap).map(renderEvent)}
      </ul>
    </div>
  );
};

export default EventsFeed;
