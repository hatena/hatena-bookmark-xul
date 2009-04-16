# based on: http://gravelog.blogspot.com/2007/03/using-rake-to-build-firefox-extensions_04.html
require 'rexml/document'
require 'digest/sha1'
require 'pathname'

include REXML
include FileUtils::Verbose

EXTENSION_NAME="hatenabookmark"
BUILD_DIR="build/#{EXTENSION_NAME}"
UPDATE_LINK="" # URL for updated xpi

directory "#{BUILD_DIR}/chrome"
task :create_buildchrome_dir => ["#{BUILD_DIR}/chrome"]

desc "prepare the chrome.manifest file"
file "#{BUILD_DIR}/chrome.manifest" => [:create_buildchrome_dir] do
  open("#{BUILD_DIR}/chrome.manifest",'w') do |infile|
    open("chrome.manifest", "r") do |outfile|
      while line = outfile.gets
        #infile.puts line.gsub(/chrome\//, "jar:chrome/#{EXTENSION_NAME}.jar!/")
        infile.puts line
      end
    end
  end
end
task :create_chrome_manifest => ["#{BUILD_DIR}/chrome.manifest"]

desc "prepare the install.rdf file"
file "#{BUILD_DIR}/install.rdf" => [:create_buildchrome_dir] do
  cp 'install.rdf', "#{BUILD_DIR}/install.rdf"
end
task :create_install_rdf => ["#{BUILD_DIR}/install.rdf"]

task :create_extra_directories => []
%w(defaults components modules resources searchplugins).each do |dir|
  if File.directory?(dir)
    dst_dir = "#{BUILD_DIR}/#{dir}"

    desc "prepare the #{dir} directory"
    file "#{BUILD_DIR}/#{dir}" => [:create_buildchrome_dir] do
      cp_r dir, dst_dir
    end
    task :create_extra_directories => dst_dir
  end
end

desc "create the chrome jar file"
task :create_chrome_jar => [:create_buildchrome_dir] do
  cp_r 'chrome', "#{BUILD_DIR}/"
  #sh "cd chrome && zip -qr -0 ../#{BUILD_DIR}/chrome/#{EXTENSION_NAME}.jar * -x \*.svn\*"
end

desc "create the xpi file and use the version number in the file name"
task :create_extension_xpi => [
                               :create_install_rdf,
                               :create_chrome_manifest,
                               :create_extra_directories,
                               :create_chrome_jar
] do
  install_rdf_file = File.new('install.rdf','r')
  install_rdf_xmldoc = Document.new(install_rdf_file)
  version_number = ""
  install_rdf_xmldoc.elements.each('RDF/Description/em:version') do |element|
    version_number = element.text
  end

  xpi = Pathname.new 'xpi'
  xpi.mkdir unless xpi.exist? 
  #sh "cd #{BUILD_DIR} && zip -qr -9 ../../xpi/#{EXTENSION_NAME}-#{version_number}-#{Time.now.strftime('%Y%m%d')}-fx.xpi *"
  sh "cd #{BUILD_DIR} && zip -qr -9 ../../xpi/#{EXTENSION_NAME}-#{version_number}.xpi *"
  rm_rf "build"
end

desc "update update.rdf"
task :update_update_manifest => [:create_extension_xpi] do
  update_rdf_xmldoc = nil

  File.open('update.rdf','r') do |f|
    update_rdf_xmldoc = Document.new(f.read)

    update_rdf_xmldoc.elements.each('//RDF:Description') do |element|
      if element.attributes['em:version']
        element.attributes['em:version'] = version_number
      end

      if element.attributes['em:updateHash']
        element.attributes['em:updateHash'] = 'sha1:' + Digest::SHA1.hexdigest(open(xpi_filename).read)
      end

      if element.attributes['em:updateLink']
        element.attributes['em:updateLink'] = UPDATE_LINK
      end
    end

    File.open('update.rdf','w') do |f|
      update_rdf_xmldoc.write(f)
    end
  end
end

desc "install to local profile directory"
task :install do
  File.open("#{firefox_profile_dir(ENV['NAME'])}/extensions/#{extension_id}", 'w') do |f|
    f.puts(Dir.pwd)
  end
end

desc "uninstall from local profile directory"
task :uninstall do
  File.unlink("#{firefox_profile_dir}/extensions/#{extension_id}")
end

task :default => :create_extension_xpi

def firefox_profile_dir(name = nil)
  name ||= 'default'
  
  base = 
    case RUBY_PLATFORM
    when /darwin/
      '~/Library/Application Support/Firefox/profiles'
    when /win/
      '~/Application Data/Mozilla/Firefox/Profiles'
    else
      '~/.mozilla/firefox'
    end

  path = Dir.glob("#{File.expand_path(base)}/*.#{name}")

  if path.length == 1
    path.first
  else
    raise
  end
end

def extension_id
  open('install.rdf','r') do |file|
    install_rdf_xmldoc = Document.new(file)
    install_rdf_xmldoc.elements.each('RDF/Description/em:id') do |element|
      return element.text
    end
  end
end

def version_number
  open('install.rdf') do |f|
    install_rdf_xmldoc = Document.new(f.read)
    install_rdf_xmldoc.elements.each('RDF/Description/em:version') do |element|
      return element.text
    end
  end
end

def xpi_filename
  #"#{EXTENSION_NAME}-#{version_number}-fx.xpi"
  "#{EXTENSION_NAME}-#{version_number}.xpi"
end
