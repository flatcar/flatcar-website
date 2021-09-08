all:
	hugo --theme=flatcar

run:
	hugo server --theme=flatcar --buildFuture --watch --disableFastRender
