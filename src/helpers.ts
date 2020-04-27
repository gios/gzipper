import fs from 'fs';
import util from 'util';

export class Helpers {
  private static readonly nativeFs = {
    mkdir: util.promisify(fs.mkdir),
  };

  /**
   * Create folders by path.
   */
  static async createFolders(target: string): Promise<void> {
    await this.nativeFs.mkdir(target, { recursive: true });
  }
}
