import React from "react";

import { wrap, type Remote } from "comlink";

type WorkerConstructor = new () => Worker;

/**
 * A React hook that manages a web worker and its Comlink proxy.
 *
 * The hook initializes the worker and proxy on first call, and returns the proxy for making calls to the worker.
 * It also ensures that the worker is terminated when the component using the hook is unmounted.
 */
export function useWebWorkerProxy<WorkerApi>(WorkerCtor: WorkerConstructor): Remote<WorkerApi> {
    const ref = React.useRef<{ worker: Worker; proxy: Remote<WorkerApi> } | null>(null);

    if (!ref.current) {
        const worker = new WorkerCtor();
        ref.current = { worker, proxy: wrap<WorkerApi>(worker) };
    }

    React.useEffect(function handleUnmount() {
        return () => {
            if (ref.current) {
                ref.current.worker.terminate();
                ref.current = null;
            }
        };
    }, []);

    return ref.current.proxy;
}
