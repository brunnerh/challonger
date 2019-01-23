import { EventUtility } from "./events-utility";

export function registerMousePerspectiveOrigin(app: ng.IModule)
{
	app.directive("utilMousePerspectiveOrigin", () => <ng.IDirective>{
		link: (_scope, element) =>
		{
			var el = element[0];
			EventUtility.throttled(el, "mousemove", (e: MouseEvent) =>
			{
				el.style.perspectiveOrigin = `${e.clientX}px ${e.clientY}px`;
			});
		}
	});
}