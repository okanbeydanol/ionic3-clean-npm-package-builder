const sass = require('node-sass');
const fs = require('fs-extra');
const path = require('path');
const { exec } = require('child_process');
const glob = require("glob");
const CleanCSS = require('clean-css');




const ragex = {
  styleUrls: /((\/*styleUrls:\/*)|((\/*styleUrls\/*)+\s+:))(\s+|\n+)?\[((\s+(\'|\"))|(\'|\"))(\?*.+)(\"|\')((\s+\])|\])/im,
  styles: /\[((\s+(\"|\'))|(\"|\'))(\?*.+)(\"|\')((\s+\])|\])/im,
  templateUrl: /((\/*templateUrl:\/*)|((\/*templateUrl\/*)+\s+:))(\s|\n)+(\'|\")(\?*.+)(\'|\")/im,
  template: /(\'|\")(\?*.+)(\'|\")/im
}
const namesRagex = {
  templateUrl: /((\/*templateUrl:\/*)|((\/*templateUrl\/*)+\s+:))/im,
  template: /((\/*template:\/*)|((\/*template\/*)+\s+:))/im,
  styleUrls: /((\/*styleUrls:\/*)|((\/*styleUrls\/*)+\s+:))/im,
  styles: /((\/*styles:\/*)|((\/*styles\/*)+\s+:))/im,
}

const tempFolder = '.tmp';
let componentInfo = {
  isHhtml: false,
  isHcss: false,
  folderPath: null,
  filePath: null,
  fileName: null,
  extension: null,
  component: null,
  cssPaths: null,
  htmlPath: null,
};
process();
async function process(done = () => { }) {
  const es2015 = runNgc(`${tempFolder}/tsconfig.json`);
  const umd = runNgc(`${tempFolder}/tsconfig.umd.json`);
  prepareTempFolder();
  await prepareFiles();
  const build = await Promise.all([es2015, umd]);
  console.log('Moving /dist to root');
  moveDist();
  done();
}

function prepareFiles() {
  return new Promise(async (resolve, reject) => {
    glob(".tmp/src/lib/**/", {}, function (er, folders) {
      folders.reduce((lastPromise, folder) => {
        return lastPromise.then(async () => {
          componentInfo = {
            isHhtml: false,
            isHcss: false,
            folderPath: null,
            filePath: null,
            fileName: null,
            extension: null,
            component: null,
            cssPaths: null,
            htmlPath: null,
          };
          return await getFiles(folder);
        });
      }, Promise.resolve())
        .then(() => {
          resolve();
        });
    });
  });
}

function getFiles(folder) {
  return new Promise((resolve) => {
    glob(folder + '/*', {}, function (er, filesPath) {
      filesPath.reduce((lastPromise, filePath) => {
        return lastPromise.then(async () => {
          const isFile = fs.lstatSync(filePath).isFile();
          if (isFile) {
            componentInfo.extension = path.extname(filePath);
            componentInfo.fileName = path.basename(filePath);
            componentInfo.folderPath = folder;
            componentInfo.filePath = filePath;
            componentInfo;
            if (componentInfo.extension == '.ts') {
              componentInfo.component = await getFileContent(filePath);
              componentInfo.isHhtml = await isHHtml(componentInfo);
              componentInfo.isHcss = await isHCss(componentInfo);
              if (componentInfo.isHhtml) {
                componentInfo.htmlPath = await getHtmlFilePath(componentInfo);
              }
              if (componentInfo.isHcss) {
                componentInfo.cssPaths = await getCssFilePaths(componentInfo);
              }
              componentInfo.component = await getRender(componentInfo);
              return await writeFile(filePath, componentInfo.component);
            } else {
              return componentInfo.filePath;
            }
          }
        });
      }, Promise.resolve())
        .then(() => {
          resolve();
        });
    });
  });

}
async function getRender(componentInfo) {
  return new Promise(async (resolve, reject) => {
    componentInfo.component = await replaceCss(componentInfo);
    componentInfo.component = await replaceHtml(componentInfo);
    resolve(componentInfo.component);
  });
}


function getFileBaseName(str) {
  let new_str = null;
  const templateUrl = str.match(ragex.templateUrl);
  if (templateUrl) {
    const template = templateUrl[0].match(ragex.template);
    if (template) {
      new_str = template[0].toString().replace(/\'/gmi, '"').trim();
    }
  }
  return (new_str)
}

function getFileBaseNames(str) {
  let new_str = [];
  const styleUrls = str.match(ragex.styleUrls);
  if (styleUrls) {
    const styles = styleUrls[0].match(ragex.styles);
    if (styles) {
      new_str = styles[0].toString().replace(/\'/gmi, '"').trim();
    }
  }
  return (new_str)
}

function replaceHtml(componentInfo) {
  return new Promise(async (resolve, reject) => {
    if (componentInfo.htmlPath) {
      const isFile = fs.lstatSync(componentInfo.htmlPath).isFile();
      if (isFile) {
        const fileContent = await getFileContent(componentInfo.htmlPath);
        const templateUrl = componentInfo.component.match(ragex.templateUrl);
        if (templateUrl) {
          componentInfo.component = componentInfo.component.replace(templateUrl[0], "template: `" + `${fileContent ? fileContent : ``}` + "`");
        }
      }
    }
    resolve(componentInfo.component)
  });
}

async function replaceCss(componentInfo) {
  return new Promise(async (resolve, reject) => {
    if (componentInfo.cssPaths) {
      let styles = [];
      Array.from(componentInfo.cssPaths).reduce((lastPromise, cssPath) => {
        return lastPromise.then(async () => {
          const isFile = fs.lstatSync(cssPath).isFile();
          if (isFile) {
            const fileContent = await getFileContent(cssPath);
            if (fileContent) {
              styles.push(await getCss(fileContent));
            }
          }
        });
      }, Promise.resolve())
        .then(async () => {
          const cleanStyle = [];
          const styleUrls = componentInfo.component.match(ragex.styleUrls);
          if (styleUrls) {
            await styles.forEach(style => {
              var options = { /* options */ };
              cleanStyle.push(new CleanCSS(options).minify(style).styles);
            });
            const replacement = JSON.stringify(cleanStyle);
            componentInfo.component = componentInfo.component.replace(styleUrls[0], `styles: ${replacement}`);
          }
          resolve(componentInfo.component);
        });
    } else {
      resolve(componentInfo.component);
    }
  });
}

function getHtmlFilePath(componentInfo) {
  return new Promise(async (resolve, reject) => {
    if (componentInfo.component.match(namesRagex.template)) {
      resolve(null);
    } else if (componentInfo.component.match(namesRagex.templateUrl)) {
      const htmlFileBasePath = await getFileBaseName(componentInfo.component);
      const folder = componentInfo.folderPath;
      if (htmlFileBasePath) {
        resolve(folder + htmlFileBasePath.replace(/(\"|\')/img, ''));
      } else {
        resolve(null);
      }
    } else {
      resolve(null);
    }
  });
}

function getCssFilePaths(componentInfo) {
  return new Promise(async (resolve, reject) => {
    if (componentInfo.component.match(namesRagex.styles)) {
      resolve(null);
    } else if (componentInfo.component.match(namesRagex.styleUrls)) {
      const paths = await getFileBaseNames(componentInfo.component);
      if (paths) {
        const folder = componentInfo.folderPath;
        const newArray = [];
        JSON.parse(paths).forEach(path => {
          newArray.push(folder + path)
        });
        resolve(newArray);
      }
    } else {
      resolve(null);
    }
  });
}

function isHCss(componentInfo) {
  return new Promise((resolve, reject) => {
    if (componentInfo.component.match(namesRagex.styles) || componentInfo.component.match(namesRagex.styleUrls)) {
      resolve(true);
    } else {
      resolve(false)
    }
  });
}

function isHHtml(componentInfo) {
  return new Promise((resolve, reject) => {
    if (componentInfo.component.match(namesRagex.template) || componentInfo.component.match(namesRagex.templateUrl)) {
      resolve(true);
    } else {
      resolve(false)
    }
  });
}

function moveDist() {
  return fs.copy(`${tempFolder}/dist`, 'dist', {
    overwrite: true
  });
}

function runNgc(tsConfigPath) {
  const ngc = path.resolve('node_modules', '.bin', 'ngc');
  return new Promise((resolve, reject) => {
    exec(`${ngc} -p ${tsConfigPath}`, (err, stdout, stdeer) => {
      if (err) {
        console.log('Error !', err);
        reject(err);
      }
      resolve(tsConfigPath);
    });
  });
}

function getCss(scss_content) {
  const style = sass.renderSync({
    data: scss_content
  });

  return style.css
    .toString()
    .replace(/([\n\r]\s*)+/gm, ' ')
    .replace(/"/g, '\\"');
}

async function getFileContent(path) {
  if (fs.existsSync(path)) {
    return fs.readFile(path, 'utf8');
  } else {
    return '{}';
  }
}

function writeFile(path, data) {
  return new Promise((resolve, reject) => {
    fs.writeFile(path, data, err => {
      if (err) {
        console.log('Error while writing file !', err);
        reject(err);
      }
      resolve(path);
    });
  });
}

function prepareTempFolder() {
  fs.removeSync(tempFolder);
  fs.copySync('src', `${tempFolder}/src`);
  fs.copySync('tsconfig.json', `${tempFolder}/tsconfig.json`);
  fs.copySync('tsconfig.umd.json', `${tempFolder}/tsconfig.umd.json`);
}

module.exports = { process };