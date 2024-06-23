import ts from "typescript";

const printer = ts.createPrinter();

const toString = (node: ts.Node, source: ts.SourceFile) => {
	return printer.printNode(ts.EmitHint.Unspecified, node, source);
};

const createIdentifierInitializer = (options: { expr: string }) => {
	return ts.factory.createObjectLiteralExpression(
		[
			ts.factory.createMethodDeclaration(
				undefined,
				undefined,
				ts.factory.createIdentifier("get"),
				undefined,
				undefined,
				[],
				undefined,
				ts.factory.createBlock(
					[
						ts.factory.createReturnStatement(
							ts.factory.createCallExpression(
								ts.factory.createIdentifier("eval"),
								undefined,
								[
									ts.factory.createPropertyAccessExpression(
										ts.factory.createThis(),
										ts.factory.createIdentifier("expr"),
									),
								],
							),
						),
					],
					false,
				),
			),
			ts.factory.createPropertyAssignment(
				ts.factory.createIdentifier("expr"),
				ts.factory.createStringLiteral(options.expr),
			),
		],
		false,
	);
};

const getIdenfierValue = (identifier: string) => {
	return ts.factory.createCallExpression(
		ts.factory.createPropertyAccessExpression(
			ts.factory.createIdentifier(identifier),
			ts.factory.createIdentifier("get"),
		),
		undefined,
		[],
	);
};

const undefinedKeyword = () => {
	return ts.factory.createIdentifier("undefined");
};

const isAssignment = (node: ts.Node): node is ts.BinaryExpression => {
	return (
		ts.isBinaryExpression(node) &&
		[
			ts.SyntaxKind.EqualsToken,
			ts.SyntaxKind.PlusEqualsToken,
			ts.SyntaxKind.MinusEqualsToken,
		].includes(node.operatorToken.kind)
	);
};

export const transform = ({
	filename,
	content,
}: {
	filename: string;
	content: string;
}) => {
	const source = ts.createSourceFile(
		filename,
		content,
		{
			languageVersion: ts.ScriptTarget.ESNext,
			impliedNodeFormat: ts.ModuleKind.ESNext,
		},
		/** setParentNodes */ true,
		ts.ScriptKind.TS,
	);

	// using an identifier
	const getIdentifiersVisitor: ts.Visitor = (node: ts.Node) => {
		if (
			ts.isIdentifier(node) &&
			!(ts.isVariableDeclaration(node.parent) && node.parent.name === node)
		) {
			return getIdenfierValue(node.getText());
		}
		return ts.visitEachChild(node, getIdentifiersVisitor, undefined);
	};

	const visitor: ts.Visitor = (node) => {
		if (ts.isVariableDeclaration(node)) {
			const initializer = node.initializer ?? undefinedKeyword();
			if (!ts.isArrowFunction(initializer)) {
				return ts.factory.updateVariableDeclaration(
					node,
					node.name,
					node.exclamationToken,
					node.type,
					createIdentifierInitializer({
						expr: toString(
							ts.visitNode(initializer, getIdentifiersVisitor)!,
							source,
						),
					}),
				);
			}
		} else if (isAssignment(node) && ts.isIdentifier(node.left)) {
			// reassignments

			const expression = toString(
				ts.visitNode(node.right, getIdentifiersVisitor)!,
				source,
			);

			const [head, ...rest] = expression.split(`${node.left.getText()}.get()`);

			if (rest.length > 0) {
				// Manage self-references
				const templateSpans: ts.TemplateSpan[] = [];

				for (let index = 0; index < rest.length - 1; index++) {
					templateSpans.push(
						ts.factory.createTemplateSpan(
							ts.factory.createPropertyAccessExpression(
								ts.factory.createIdentifier(node.left.getText()),
								ts.factory.createIdentifier("expr"),
							),
							ts.factory.createTemplateMiddle(rest[index]!),
						),
					);
				}
				templateSpans.push(
					ts.factory.createTemplateSpan(
						ts.factory.createPropertyAccessExpression(
							ts.factory.createIdentifier(node.left.getText()),
							ts.factory.createIdentifier("expr"),
						),
						ts.factory.createTemplateTail(rest[rest.length - 1]!),
					),
				);

				return ts.factory.updateBinaryExpression(
					node,
					ts.factory.createPropertyAccessExpression(
						ts.factory.createIdentifier(node.left.getText()),
						ts.factory.createIdentifier("expr"),
					),
					node.operatorToken,
					ts.factory.createTemplateExpression(
						ts.factory.createTemplateHead(head!, head!),
						templateSpans,
					),
				);
			}

			return ts.factory.updateBinaryExpression(
				node,
				ts.factory.createPropertyAccessExpression(
					ts.factory.createIdentifier(node.left.getText()),
					ts.factory.createIdentifier("expr"),
				),
				node.operatorToken,
				ts.factory.createStringLiteral(
					toString(ts.visitNode(node.right, getIdentifiersVisitor)!, source),
				),
			);
		} else if (
			ts.isExpressionStatement(node) &&
			!isAssignment(node.expression)
		) {
			if (ts.isCallExpression(node.expression)) {
				return node;
			}
			return ts.visitNode(node.expression, getIdentifiersVisitor);
		}

		return ts.visitEachChild(node, visitor, undefined);
	};

	const transformed = ts.visitNode(source, visitor);

	if (!transformed)
		throw new Error(
			`auto-sync: something went wrong when transforming module ${filename}`,
		);

	return toString(transformed, source);
};
