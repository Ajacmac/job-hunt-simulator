import React, { useState, useEffect } from "react"
import { mean, runSingleJobHuntSimulation, singleJobApplication, runSimulationChains } from "./analysis.js"
import { period } from "./constants.js"

const HorizontalBar = ({width}) => (
  <div className="graph-horizontal-bar" style={{width: `${width}%`}} />
)

export const SimulationRun = ({ parameters: originalParameters }) => {
  const {general_numberOfSimulationsToRun, ...parameters} = originalParameters
  const [simulationResults, setSimulationResults] = useState(null)

  useEffect(() => {
    const handle = setTimeout(() => {
      const results = Array.from(
        runSimulationChains(general_numberOfSimulationsToRun(), () => runSingleJobHuntSimulation(parameters, () => singleJobApplication(parameters)))
      )
      const meanPeriodsToEnd = mean(results.map((x) => x.periods))
      const meanTotalApplications = mean(results.map((x) => x.totalApplications))
      const allRejectionReasons = new Set(results.map((x) => x.unsuccesfulCountsByReason.keys()).flatMap((x) => Array.from(x)))
      const meanTotalOffers = mean(results.map((x) => x.allOffers.size))
      const meanRejectionsByReason = Array.from(allRejectionReasons.values()).sort().map((reason) => [
        reason,
        mean(results.map((x) => x.unsuccesfulCountsByReason.get(reason) || 0)),
      ])
      setSimulationResults({ meanPeriodsToEnd, meanTotalOffers, meanTotalApplications, meanRejectionsByReason })
    }, 500) //debounce by 500ms
    return () => clearTimeout(handle)
  }, [originalParameters]) // eslint-disable-line

  const pcnt = val => !simulationResults || !simulationResults.meanTotalApplications ? null : (100.0 * val)/simulationResults.meanTotalApplications

  return (
    <article className="simulation-run">
      <header>Simulation Results</header>
      {!simulationResults ? null : (
        <dl className="simulation-results">
          <dd>Mean {period}s in job hunt
          </dd>
          <dt>
            {simulationResults.meanPeriodsToEnd.toFixed(2)}
          </dt>
          <dd>Mean total applications</dd>
          <dt>{simulationResults.meanTotalApplications.toFixed(2)}</dt>
          <dd>Mean total offers</dd>
          <dt>{simulationResults.meanTotalOffers.toFixed(2)}</dt>
          <dd>Mean Rejections by Reason</dd>
          <dt>
            <dl className="simulation-rejections-by-reason">
              {simulationResults.meanRejectionsByReason.map(([reason, count]) => (
                <React.Fragment key={reason}>
                  <dd>
                    <div>{reason}</div>
                    <HorizontalBar width={pcnt(count)}/>
                  </dd>
                  <dt>{count.toFixed(2)}</dt>
                </React.Fragment>
              ))}
            </dl>
          </dt>
        </dl>
      )}
    </article>
  )
}
