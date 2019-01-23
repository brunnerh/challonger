export function registerSelectOnFocus(app: ng.IModule)
{
	app.directive("utilSelectOnFocus", [() =>
		({
			restrict: 'A',
			link: (_scope, element: JQLite) =>
			{
				element[0].addEventListener("focus", e =>
					(<HTMLInputElement>e.target).select());
			}
		})]);
}