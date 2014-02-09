PUBLIC_DIR = ./public
BOWER_DIR = ./bower_components

stats:
	gitstats . ./out
	open ./out/index.html

js:
	@uglifyjs \
		$(BOWER_DIR)/fastclick/lib/fastclick.js \
		$(PUBLIC_DIR)/js/util.js \
		$(PUBLIC_DIR)/js/bootstrap-validation.js \
		$(PUBLIC_DIR)/js/protocol.js \
		$(PUBLIC_DIR)/js/config-dev.js \
		$(PUBLIC_DIR)/js/main.js \
		-m -c -b
