import {spawn} from 'cross-spawn'
import commandConvert from './command'
import isWindows from 'is-windows'

export default crossEnv

const envSetterRegex = /(\w+)=('(.+)'|"(.+)"|(.+))/

function crossEnv(args) {
  const [command, commandArgs, env] = getCommandArgsAndEnvVars(args)
  if (command) {
    const proc = _spawn(command, commandArgs, {stdio: 'inherit', env})
    process.on('SIGTERM', () => proc.kill('SIGTERM'))
    process.on('SIGINT', () => proc.kill('SIGINT'))
    process.on('SIGBREAK', () => proc.kill('SIGBREAK'))
    process.on('SIGHUP', () => proc.kill('SIGHUP'))
    proc.on('exit', process.exit)
    return proc
  }
  return null
}

function _spawn(command, commandArgs, env) {
  let shellCommand
  let shellArgs
  if (isWindows) {
    shellCommand = process.env.comspec || 'cmd.exe'
    shellArgs = ['/c', command, ...commandArgs]
  } else {
    shellCommand = 'sh' // Can this not exist for some reason?
    shellArgs = ['-c', command, ...commandArgs]
  }
  return spawn(shellCommand, shellArgs, env)
}

function getCommandArgsAndEnvVars(args) {
  const envVars = getEnvVars()
  const commandArgs = args.map(commandConvert)
  const command = getCommand(commandArgs, envVars)
  return [command, commandArgs, envVars]
}

function getCommand(commandArgs, envVars) {
  while (commandArgs.length) {
    const shifted = commandArgs.shift()
    const match = envSetterRegex.exec(shifted)
    if (match) {
      envVars[match[1]] = match[3] || match[4] || match[5]
    } else {
      return shifted
    }
  }
  return null
}

function getEnvVars() {
  const envVars = Object.assign({}, process.env)
  if (process.env.APPDATA) {
    envVars.APPDATA = process.env.APPDATA
  }
  return envVars
}
