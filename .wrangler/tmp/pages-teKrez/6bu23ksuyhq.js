// <define:__ROUTES__>
var define_ROUTES_default = {
  version: 1,
  include: ["/"],
  exclude: []
};

// ../../../AppData/Local/Temp/bunx-2636993846-wrangler@latest/node_modules/wrangler/templates/pages-dev-pipeline.ts
import worker from "C:\\Users\\nsara\\Dev\\kochitechgroup\\website\\.wrangler\\tmp\\pages-teKrez\\functionsWorker-0.6216218505382969.mjs";
import { isRoutingRuleMatch } from "C:\\Users\\nsara\\AppData\\Local\\Temp\\bunx-2636993846-wrangler@latest\\node_modules\\wrangler\\templates\\pages-dev-util.ts";
export * from "C:\\Users\\nsara\\Dev\\kochitechgroup\\website\\.wrangler\\tmp\\pages-teKrez\\functionsWorker-0.6216218505382969.mjs";
var routes = define_ROUTES_default;
var pages_dev_pipeline_default = {
  fetch(request, env, context) {
    const { pathname } = new URL(request.url);
    for (const exclude of routes.exclude) {
      if (isRoutingRuleMatch(pathname, exclude)) {
        return env.ASSETS.fetch(request);
      }
    }
    for (const include of routes.include) {
      if (isRoutingRuleMatch(pathname, include)) {
        const workerAsHandler = worker;
        if (workerAsHandler.fetch === void 0) {
          throw new TypeError("Entry point missing `fetch` handler");
        }
        return workerAsHandler.fetch(request, env, context);
      }
    }
    return env.ASSETS.fetch(request);
  }
};
export {
  pages_dev_pipeline_default as default
};
//# sourceMappingURL=6bu23ksuyhq.js.map
