const tracium = require('tracium')
const { readFile } = require('./utils')

async function generateTasksReport(pathToTraceFile) {
  const content = JSON.parse(await readFile(pathToTraceFile))
  return tracium.computeMainThreadTasks(content, {
    flatten: true,
  })
}

function formatTime(time) {
  return +parseFloat(time).toFixed(2)
}

function getEventsTime(events) {
  const time = events.reduce((acc, cur) => acc + cur.selfTime, 0)
  return formatTime(Math.round(time * 100) / 100)
}

async function generatePrettyReport(traceFiles) {
  const report = []

  for (const lib of traceFiles) {
    const tasks = await generateTasksReport(lib.traceFile)
    const htmlTime = getEventsTime(tasks.filter(({ kind }) => kind === 'parseHTML'))
    const styleTime = getEventsTime(tasks.filter(({ kind }) => kind === 'styleLayout'))
    const renderTime = getEventsTime(tasks.filter(({ kind }) => kind === 'paintCompositeRender'))
    const compileTime = getEventsTime(tasks.filter(({ kind }) => kind === 'scriptParseCompile'))
    const evaluationTime = getEventsTime(tasks.filter(({ kind }) => kind === 'scriptEvaluation'))
    const garbageTime = getEventsTime(tasks.filter(({ kind }) => kind === 'garbageCollection'))
    const otherTime = getEventsTime(tasks.filter(({ kind }) => kind === 'other'))

    report.push({
      path: lib.name,
      parseHTML: htmlTime,
      styleLayout: styleTime,
      paintCompositeRender: renderTime,
      scriptParseCompile: compileTime,
      scriptEvaluation: evaluationTime,
      javaScript: formatTime(compileTime + evaluationTime),
      garbageCollection: garbageTime,
      other: otherTime,
      total: formatTime(
        htmlTime + styleTime + renderTime + compileTime + evaluationTime + garbageTime + otherTime,
      ),
    })
  }

  return report
}

module.exports = { generateReadableReport: generatePrettyReport, formatTime, getEventsTime }
