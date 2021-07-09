const cluster = require("cluster");
const numCPUs = require("os").cpus().length;

/**
 * Forks the currently running script - if called within a forked process, returns false
 * @param {number} numProcesses - determines number of processes to fork to (defaults to number of cpus)
 * @param {boolean} restartOnExit - restart child processes if they stop for any reason (eg: on unhandled exceptions)
 * @returns boolean - true if called from master process, false if called from child process (can be used for early termination
 * when in master process, eg: `if (forkCluster()) return;`)
 */
function forkCluster(numProcesses = numCPUs, restartOnExit = false) {
  if (!cluster.isMaster) return false;

  for (let i = 0; i < numProcesses; i++) cluster.fork();

  if (restartOnExit)
    cluster.on("exit", (worker, code, signal) => {
      cluster.fork();
    });

  return true;
}

module.exports = forkCluster;
