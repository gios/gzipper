import sinon from 'sinon';
import assert from 'assert';

import { Index } from '../../index';

describe('Index CLI', () => {
  let sinonSandbox: sinon.SinonSandbox;

  beforeEach(() => {
    sinonSandbox = sinon.createSandbox();
  });

  afterEach(async () => {
    sinonSandbox.restore();
    sinon.restore();
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
      '--gzip-level',
      '7',
      '--gzip-memory-level',
      '1',
      '--gzip-strategy',
      '3',
      '--brotli',
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
      gzipLevel: 7,
      gzipMemoryLevel: 1,
      gzipStrategy: 3,
      brotli: true,
      brotliParamMode: 'text',
      brotliQuality: 5,
      brotliSizeHint: 77,
      outputFileFormat: 'test-[filename].[ext].[compressExt]',
    };

    for (const [key, val] of result.options) {
      assert.ok(response[key] === val);
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
      'png,jpg,js',
      '--include',
      'png,wav',
      '--threshold',
      '500',
      '--gzip-level',
      '7',
      '--gzip-memory-level',
      '1',
      '--gzip-strategy',
      '3',
      '--output-file-format',
      'test-[filename].[ext].[compressExt]',
    ];

    const index = new Index();
    (index as any).argv = cliArguments;
    sinonSandbox.stub(index, 'start' as any).returns(null);
    const result: any = index.getOptions().filterOptions();
    assert.strictEqual(result.target, 'folder_to_compress');
    assert.strictEqual(result.outputPath, 'folder_to_compress_out');

    const response: any = {
      verbose: true,
      exclude: ['.png', '.jpg', '.js'],
      include: ['.png', '.wav'],
      threshold: 500,
      gzipLevel: 7,
      gzipMemoryLevel: 1,
      gzipStrategy: 3,
      outputFileFormat: 'test-[filename].[ext].[compressExt]',
    };

    for (const [key, val] of result.options) {
      assert.ok(response[key] === val);
    }
  });
});
