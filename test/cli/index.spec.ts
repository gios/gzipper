import sinon from 'sinon';
import assert from 'assert';

import { Index } from '../../index';

describe('Index CLI', () => {
  let sinonSandbox: sinon.SinonSandbox;

  function compareValues(value1: unknown, value2: unknown): boolean {
    if (Array.isArray(value1) && Array.isArray(value2)) {
      return (
        value1.length === value2.length &&
        value1.every((value, index) => value === value2[index])
      );
    }

    return value1 === value2;
  }

  beforeEach(() => {
    sinonSandbox = sinon.createSandbox();
  });

  afterEach(async () => {
    sinonSandbox.restore();
    sinon.restore();
  });

  /*
   * @deprecated
   * TODO: Remove
   * --gzip-level
   * --gzip-memory-level
   * --gzip-strategy
   */
  it('--gzip-level, --gzip-memory-level, --gzip-strategy should update options', () => {
    const cliArguments = [
      'node.exe',
      'index.js',
      'folder_to_compress',
      'folder_to_compress_out',
      '--gzip-level',
      '1',
      '--gzip-memory-level',
      '3',
      '--gzip-strategy',
      '5',
    ];

    const index = new Index();
    (index as any).argv = cliArguments;
    sinonSandbox.stub(index, 'start' as any).returns(null);
    const result: any = index.getOptions().filterOptions();
    assert.strictEqual(result.target, 'folder_to_compress');
    assert.strictEqual(result.outputPath, 'folder_to_compress_out');

    const response: any = {
      level: 1,
      memoryLevel: 3,
      strategy: 5,
    };

    for (const value of Object.values(result.options)) {
      assert.notStrictEqual(value, NaN);
      assert.notStrictEqual(value, undefined);
    }

    for (const [key, val] of Object.entries(response)) {
      assert.ok(compareValues(result.options[key], val));
    }
  });

  /*
   * @deprecated
   * TODO: Remove
   * GZIPPER_GZIP_LEVEL
   * GZIPPER_GZIP_MEMORY_LEVEL
   * GZIPPER_GZIP_STRATEGY
   */
  it('GZIPPER_GZIP_LEVEL, GZIPPER_GZIP_MEMORY_LEVEL, GZIPPER_GZIP_STRATEGY should overwrite options', () => {
    const envArguments = {
      GZIPPER_GZIP_LEVEL: '5',
      GZIPPER_GZIP_MEMORY_LEVEL: '5',
      GZIPPER_GZIP_STRATEGY: '6',
    };
    const cliArguments = [
      'node.exe',
      'index.js',
      'folder_to_compress',
      'folder_to_compress_out',
      '--gzip-level',
      '1',
      '--gzip-memory-level',
      '3',
      '--gzip-strategy',
      '5',
    ];

    const index = new Index();
    (index as any).argv = cliArguments;
    (index as any).env = envArguments;
    sinonSandbox.stub(index, 'start' as any).returns(null);
    const result: any = index.getOptions().filterOptions();
    assert.strictEqual(result.target, 'folder_to_compress');
    assert.strictEqual(result.outputPath, 'folder_to_compress_out');

    const response: any = {
      level: 5,
      memoryLevel: 5,
      strategy: 6,
    };

    for (const value of Object.values(result.options)) {
      assert.notStrictEqual(value, NaN);
      assert.notStrictEqual(value, undefined);
    }

    for (const [key, val] of Object.entries(response)) {
      assert.ok(compareValues(result.options[key], val));
    }
  });

  it('getOptions() should return target, outputPath and all options', () => {
    const cliArguments = [
      'node.exe',
      'index.js',
      'folder_to_compress',
      'folder_to_compress_out',
      '--verbose',
      '--exclude',
      'png,jpg,js',
      '--include',
      'png,wav',
      '--threshold',
      '500',
      '--level',
      '7',
      '--memory-level',
      '1',
      '--strategy',
      '3',
      '--brotli',
      '--deflate',
      '--brotli-param-mode',
      'text',
      '--brotli-quality',
      '5',
      '--brotli-size-hint',
      '77',
      '--output-file-format',
      'test-[filename].[ext].[compressExt]',
    ];

    const index = new Index();
    (index as any).argv = cliArguments;
    sinonSandbox.stub(index, 'start' as any).returns(null);
    const result: any = index.getOptions();
    assert.strictEqual(result.target, 'folder_to_compress');
    assert.strictEqual(result.outputPath, 'folder_to_compress_out');

    const response: any = {
      verbose: true,
      exclude: ['.png', '.jpg', '.js'],
      include: ['.png', '.wav'],
      threshold: 500,
      level: 7,
      memoryLevel: 1,
      strategy: 3,
      brotli: true,
      deflate: true,
      brotliParamMode: 'text',
      brotliQuality: 5,
      brotliSizeHint: 77,
      outputFileFormat: 'test-[filename].[ext].[compressExt]',
    };

    for (const [key, val] of Object.entries(response)) {
      assert.ok(compareValues(result.options[key], val));
    }
  });

  it('filterOptions() should filter unused options', () => {
    const cliArguments = [
      'node.exe',
      'index.js',
      'folder_to_compress',
      'folder_to_compress_out',
      '--verbose',
      '--exclude',
      'php,cc',
      '--include',
      'css',
      '--threshold',
      '800',
      '--level',
      '4',
      '--memory-level',
      '2',
      '--strategy',
      '4',
      '--output-file-format',
      'test-[filename]-out.[ext].[compressExt]',
    ];

    const index = new Index();
    (index as any).argv = cliArguments;
    sinonSandbox.stub(index, 'start' as any).returns(null);
    const result: any = index.getOptions().filterOptions();
    assert.strictEqual(result.target, 'folder_to_compress');
    assert.strictEqual(result.outputPath, 'folder_to_compress_out');

    const response: any = {
      verbose: true,
      exclude: ['.php', '.cc'],
      include: ['.css'],
      threshold: 800,
      level: 4,
      memoryLevel: 2,
      strategy: 4,
      outputFileFormat: 'test-[filename]-out.[ext].[compressExt]',
    };

    for (const value of Object.values(result.options)) {
      assert.notStrictEqual(value, NaN);
      assert.notStrictEqual(value, undefined);
    }

    for (const [key, val] of Object.entries(response)) {
      assert.ok(compareValues(result.options[key], val));
    }
  });

  it('env variables should overwrite options', () => {
    const envArguments = {
      GZIPPER_VERBOSE: '0',
      GZIPPER_EXCLUDE: 'py,c',
      GZIPPER_INCLUDE: 'r,rs',
      GZIPPER_THRESHOLD: '800',
      GZIPPER_LEVEL: '2',
      GZIPPER_MEMORY_LEVEL: '2',
      GZIPPER_STRATEGY: '4',
      GZIPPER_BROTLI: '0',
      GZIPPER_DEFLATE: '0',
      GZIPPER_BROTLI_PARAM_MODE: 'font',
      GZIPPER_BROTLI_QUALITY: '3',
      GZIPPER_BROTLI_SIZE_HINT: '10',
      GZIPPER_OUTPUT_FILE_FORMAT: '[filename]-[hash].[ext].[compressExt]',
    };
    const cliArguments = [
      'node.exe',
      'index.js',
      'folder_to_compress',
      'folder_to_compress_out',
      '--verbose',
      '--exclude',
      'png,jpg,js',
      '--include',
      'png,wav',
      '--threshold',
      '500',
      '--level',
      '7',
      '--memory-level',
      '1',
      '--strategy',
      '3',
      '--brotli',
      '--deflate',
      '--brotli-param-mode',
      'text',
      '--brotli-quality',
      '5',
      '--brotli-size-hint',
      '77',
      '--output-file-format',
      'test-[filename].[ext].[compressExt]',
    ];

    const index = new Index();
    (index as any).argv = cliArguments;
    (index as any).env = envArguments;
    sinonSandbox.stub(index, 'start' as any).returns(null);
    const result: any = index.getOptions().filterOptions();
    assert.strictEqual(result.target, 'folder_to_compress');
    assert.strictEqual(result.outputPath, 'folder_to_compress_out');

    const response: any = {
      verbose: false,
      exclude: ['.py', '.c'],
      include: ['.r', '.rs'],
      threshold: 800,
      level: 2,
      memoryLevel: 2,
      strategy: 4,
      brotli: false,
      deflate: false,
      brotliParamMode: 'font',
      brotliQuality: 3,
      brotliSizeHint: 10,
      outputFileFormat: '[filename]-[hash].[ext].[compressExt]',
    };

    for (const [key, val] of Object.entries(response)) {
      assert.ok(compareValues(result.options[key], val));
    }
  });
});
