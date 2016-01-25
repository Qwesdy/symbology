var chai = require('chai');
var mocha = require('mocha');
var fs = require('fs');
var zint = require('../');
var regex = require('./regex');
var expect = chai.expect;

function getSymbol(obj) {
  obj = obj || {};
  return {
    symbology: obj.symbology || 20,
    foregroundColor: obj.foregroundColor || 'fff000',
    backgroundColor: obj.backgroundColor || '000000',
    fileName: obj.fileName || 'out.png',
    scale: obj.scale || 1.0,
    option1: obj.option1 || -1,
    option2: obj.option2 || -1,
    option3: obj.option3 || -1,
    show_hrt: obj.show_hrt || 1
    // input_mode: BINARY_MODE,
  };
}

function fileExists(filePath) {
  try {
    return fs.statSync(filePath).isFile();
  } catch (e) {
    return false;
  }
}

function removeFile(filePath) {
  return function() {
    if(fileExists(filePath)) {
      fs.unlink(filePath);
    }
  }
}

var noop = function() {};

function handleErr(err) {
  console.log('HARD ERROR: ', err);
}

describe('the barnode library', function() {
  describe('the createStream function', function() {
    it('should return an object with status code and png base64 data', function() {
      return zint
        .createStream(getSymbol(), '12345', 'png')
        .then(function(data) {
          console.log('DATA result: ', data);
          expect(data.code).to.be.a('number');
          expect(data.code).to.equal(0);
          expect(data.data).to.match(regex.base64);
        }, handleErr);
    });

    it('should fail with a nonzero status code and a message', function() {
      return zint
        .createStream(getSymbol({symbology: 500}), '12345', 'png')
        .then(noop, function(data) {
          console.log('DATA result: ', data);
          expect(data.code).to.be.a('number');
          expect(data.code).to.not.equal(0);
          expect(data.message).to.not.be.null;
          expect(data.message).to.be.a('string');
          expect(data.message).to.have.length.at.least(1);
        }, handleErr);
    });
  });


  describe('the createFile function to create PNG files', function() {
    var filePath = 'testfile.png';

    beforeEach(removeFile(filePath));
    afterEach(removeFile(filePath));

    it('should return a zero status code and render a png file', function() {
      return zint
        .createFile(getSymbol({fileName: filePath}), '54321')
        .then(function(data) {
          console.log('DATA result: ', data);
          var itExists = fileExists(filePath);

          expect(data.code).to.be.a('number');
          expect(data.code).to.equal(0);
          expect(data.message).to.be.null; // force travis to say what this is
          expect(itExists).to.be.true;
        }, handleErr);
    });

    it('should not render a file when given invalid param(s)', function() {
      return zint
        .createFile(getSymbol({
            symbology: 500,
            fileName: filePath
          }), '12345')
          .then(noop, function(data) {
          expect(data.message).to.be.null; // force travis to say what this is
            expect(data.code).to.be.a('number');
            console.log('ERROR: ', data);
            expect(data.code).to.not.equal(0);
            expect(data.message).to.not.be.null;
            expect(data.message).to.be.a('string');
            expect(data.message).to.have.length.at.least(1);

            return ensureFileNotExists(fileNamePng);
          });
    });
  });

  describe('the createFile function to create SVG files', function() {
    var filePath = 'testfile.svg';

    beforeEach(removeFile(filePath));
    afterEach(removeFile(filePath));

    it('should return a zero status code and render an SVG file', function() {
      return zint
        .createFile(getSymbol({fileName: filePath}), '54321')
        .then(function(data) {
          console.log('DATA result: ', data);
          expect(data.message).to.be.null; // force travis to say what this is
          var itExists = fileExists(filePath);

          expect(data.code).to.be.a('number');
          expect(data.code).to.equal(0);
          expect(itExists).to.be.true;
        }, handleErr);
    });

    it('should render an SVG file with valid XML data', function(done) {
      zint
        .createFile(getSymbol({fileName: filePath}), '54321')
        .then(function(data) {
          console.log('DATA result: ', data);
          expect(data.message).to.be.null; // force travis to say what this is
          if(fileExists(filePath)) {
            var fileContents = fs.readFile(filePath, 'utf8', function(err, fileData) {
              if(err) {
                return err;
              }
              expect(fileData).to.match(regex.xml);
              done();
            });
          } else {
            return;
          }
        }, handleErr);
    });
  });
});