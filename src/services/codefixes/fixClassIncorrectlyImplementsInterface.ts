/* @internal */
namespace ts.codefix {
    registerCodeFix({
        errorCodes: [Diagnostics.Class_0_incorrectly_implements_interface_1.code],
        getCodeActions: (context: CodeFixContext) => {
            const sourceFile = context.sourceFile;
            const start = context.span.start;
            const token = getTokenAtPosition(sourceFile, start);
            const checker = context.program.getTypeChecker();

            const classDecl = getAncestor(token, SyntaxKind.ClassDeclaration) as ClassDeclaration;
            if (!(classDecl && isClassLike(classDecl))) {
                return undefined;
            }

            const startPos: number = classDecl.members.pos;

            const implementedTypeNodes = getClassImplementsHeritageClauseElements(classDecl);
            const implementedTypes = implementedTypeNodes.map(checker.getTypeFromTypeReference);
            const resolvedImplementedTypes = implementedTypes.map(checker.resolveStructuredTypeMembers);

            const result: CodeAction[] = [];

            for (const resolvedType of resolvedImplementedTypes) {
                const insertion = getMissingMembersInsertion(classDecl, resolvedType, checker, context.newLineCharacter);
                pushAction(result, insertion, getLocaleSpecificMessage(Diagnostics.Implement_interface_on_class));
            }

            return result;

            function pushAction(result: CodeAction[], insertion: string, description: string): void {
                if (insertion && insertion.length) {
                    const newAction: CodeAction = {
                        description: description,
                        changes: [{
                            fileName: sourceFile.fileName,
                            textChanges: [{
                                span: { start: startPos, length: 0 },
                                newText: insertion
                            }]
                        }]
                    };
                    result.push(newAction);
                }
            }
        }
    });
}