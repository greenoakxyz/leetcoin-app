import spawnAsync from '@expo/spawn-async';
import Runner from './runner';
import {RunnerOutput, RunnerStatus} from "../models";

export class SolidityRunner extends Runner {
  private readonly defaultFile: string;

  public getDefaultFile() {
    return this.defaultFile;
  }

  constructor() {
    super();
    this.defaultFile = 'contracts/solution.sol';
    this.sourceFile = "contracts/solution.sol";
    this.testFile = "test/test.js";
  }
  //               testfile      targetDir          testFileName      extension
  public async run(file: string, directory: string, filename: string, extension: string): Promise<RunnerOutput> {
    if (extension.toLowerCase() !== '.sol') {
      console.log(`${file} is not a Sol file.`);
      return {
        status: RunnerStatus.NO_OP,
        rawOutput: ''
      };
    }
    try {
      return await this.compile(file, directory, filename);
    } catch (err) {
      console.log(`[solidityRunner][run] err: ${err}`);
      throw err;
    }
  }

  // compile a Rust file
  async compile(file: string, directory: string, filename: string): Promise<RunnerOutput> {
    const options = {cwd: directory};
    try {
      const {stdout, stderr} = await spawnAsync('truffle', ['compile'], options);
      if (stderr !== '') {
        return {
          status: RunnerStatus.FAILED_TO_COMPILE,
          rawOutput: stderr,
        };
      }
      console.log(`[solidityRunner][compile] stdout: ${stdout}`);
      return await this.execute(directory, filename, options);
    } catch (err) {
      console.log(`[solidityRunner][compile] err: ${err}`);
      throw err;
    }
  }

  // execute the compiled file
  async execute(directory: string, filename: string, options: any): Promise<RunnerOutput> {
    try {
      const {stdout, stderr} = await spawnAsync('truffle', ['test', '--debug'], options);
      console.log(`[solidityRunner][execute] stdout: ${stdout}`);
      if (stderr !== '') {
        console.log(`[solidityRunner][execute] stderr: ${stderr}`);
        return {
          status: RunnerStatus.FAILED_TESTS,
          rawOutput: stderr,
        };
      }
      return {
        status: RunnerStatus.SUCCESS,
        rawOutput: stdout,
      };
    } catch (err) {
      console.error(`[solidityRunner][execute] stderr: ${err}`);
      return {
        status: RunnerStatus.SYSTEM_ERROR,
        rawOutput: JSON.stringify(err),
      };
    }
  }

  log(message: string) {
    console.log(message);
  }
}