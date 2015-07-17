# canvasEditor
Editor for html canvas

```html
<html>
<head>
    <title>Canvas editor</title>
    <script src="http://code.jquery.com/jquery-latest.min.js" type="text/javascript"></script>
    <script type="text/javascript" src="canvas-editor.js"></script>
    <link media="all" rel="stylesheet" href="canvas-editor.css">    
    <link media="all" rel="stylesheet" href="http://code.ionicframework.com/ionicons/2.0.1/css/ionicons.min.css">
    <script type="text/javascript">
        $( document ).ready(function() {
            $('#screenshot-canvas').canvasEdit({
                'width': 1024,
                'height': 758
            });
        });
    </script>
</head>
<body>
    <canvas class="full-canvas" id="screenshot-canvas"></canvas>
</body>
</html>
```

![alt tag](https://github.com/null-none/canvasEditor/blob/master/images/2015-07-17_2318.png)

![alt tag](https://github.com/null-none/canvasEditor/blob/master/images/2015-07-17_2319.png)
