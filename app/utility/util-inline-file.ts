export function registerInlineFile(app: ng.IModule)
{
	app.directive("utilInlineFile", ["$http", ($http: ng.IHttpService) =>
	(<ng.IDirective>{
		restrict: 'E',
		scope: {
			path: "="
		},
		link: (scope: IUtilInlineFileScope, element: HTMLElement[]) =>
		{
			var path = scope.path;
			var target = element[0];
			$http.get<any>(path).then(res =>
			{
				if (res.headers == null)
					throw new Error("No headers received.");

				var type = res.headers("Content-type");
				var domTypes = ["text/xml", "text/html", "image/svg+xml"];
				if (type != null && domTypes.some(t => t == type))
				{
					var parser = new DOMParser();
					var root = parser.parseFromString(res.data, <SupportedType>type).documentElement;
					Array.from<string>(target.classList).forEach(cls => root.classList.add(cls));
					if (target.parentElement == null)
						throw new Error("Target cannot be replaced.")
					target.parentElement.replaceChild(root, target);
				}
				else
				{
					var text = document.createTextNode(res.data);
					if (target.parentElement == null)
						throw new Error("Target cannot be replaced.")
					target.parentElement.replaceChild(text, target);
				}
			});
		}
	})]);
}

interface IUtilInlineFileScope extends ng.IScope
{
	path: string;
}